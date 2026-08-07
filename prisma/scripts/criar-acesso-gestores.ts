import bcrypt from "bcryptjs";
import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { createWelcomeEmailSender } from "@/modules/users/infrastructure/factories/welcome-email-sender.factory";
import type { WelcomeEmailSender } from "@/modules/users/domain/services/welcome-email-sender";
import { partirNome } from "@/modules/gestores/utils/partir-nome.util";

// Cria login (Cargo.GESTOR) pros Gestores que ainda não têm userId, com a
// senha temporária desta rodada (mustChangePassword = true — troca
// obrigatória no primeiro acesso, confirmado com o Vinicius em
// 2026-08-05). Casos especiais resolvidos manualmente antes do loop
// genérico:
//
// - Karla Santos / Pedro Ciccarelli / Vinicius Neves: o Gestor está sem
//   e-mail cadastrado, mas o Executivo homônimo já tem User (backfill
//   anterior, ver backfill-userid-gestores-promotores.ts) — só linka
//   Gestor.userId ao User que já existe, não cria conta nova.
// - Cecilia Uda / Sekai: mesma pessoa cadastrada duas vezes como Gestor
//   (um com nome errado "SEKAI", outro sem e-mail) — confirmado com o
//   Vinicius. Cria 1 User só (e-mail da Cecilia) e linka os dois Gestores
//   + o Executivo homônimo a ele.
// - Sakura BR: e-mail é o placeholder "sem-envio@sakuratur.invalid" (time,
//   não pessoa) — pulado, sem login.
//
// Regra geral (loop): Gestor tem prioridade sobre Executivo — se existir
// um Promotor com o MESMO e-mail ainda sem userId, é só espelho da mesma
// pessoa, então linka os dois ao mesmo User em vez de deixar o Executivo
// esquecido.
//
// Idempotente (só cria/linka onde userId ainda é null).
//
// Uso: DATABASE_URL=... DATABASE_CA_CERT=... bun run prisma/scripts/criar-acesso-gestores.ts
const SENHA_TEMPORARIA = "Sakura@2026";
const SALT_ROUNDS = 10;

async function main() {
  const welcomeEmailSender = createWelcomeEmailSender();
  const passwordHash = await bcrypt.hash(SENHA_TEMPORARIA, SALT_ROUNDS);

  await linkarAoExecutivoExistente(["KARLA SANTOS", "PEDRO CICCARELLI", "VINICIUS NEVES"]);
  await resolverCeciliaUdaESekai(passwordHash, welcomeEmailSender);

  const gestores = await prisma.gestor.findMany({
    where: { userId: null },
    select: { id: true, nome: true, email: true, telefone: true },
    orderBy: { nome: "asc" },
  });

  let criados = 0;
  let pulados = 0;

  for (const gestor of gestores) {
    const email = gestor.email?.trim().toLowerCase();
    if (!email || email.endsWith("@sakuratur.invalid")) {
      console.warn(
        `PULANDO gestor "${gestor.nome}" — sem e-mail utilizável (${gestor.email ?? "NULL"}).`,
      );
      pulados += 1;
      continue;
    }

    await criarUsuarioEVincular({
      nome: gestor.nome,
      email,
      telefone: gestor.telefone,
      gestorIds: [gestor.id],
      passwordHash,
      welcomeEmailSender,
    });
    criados += 1;
  }

  console.warn(
    `Concluído: ${criados} conta(s) nova(s) criada(s), ${pulados} gestor(es) pulado(s).`,
  );
}

async function linkarAoExecutivoExistente(nomes: string[]): Promise<void> {
  for (const nome of nomes) {
    const gestor = await prisma.gestor.findFirst({ where: { nome, userId: null } });
    if (!gestor) continue;

    const promotor = await prisma.promotor.findFirst({ where: { nome }, select: { userId: true } });
    if (!promotor?.userId) {
      console.warn(
        `AVISO: "${nome}" — Executivo homônimo não encontrado ou sem userId, não linkei o Gestor.`,
      );
      continue;
    }

    await prisma.gestor.update({ where: { id: gestor.id }, data: { userId: promotor.userId } });
    console.warn(
      `OK: gestor "${nome}" linkado ao User ${promotor.userId} (já existente via Executivo).`,
    );
  }
}

async function resolverCeciliaUdaESekai(
  passwordHash: string,
  welcomeEmailSender: WelcomeEmailSender,
): Promise<void> {
  const email = "cecilia.uda@sakuratur.com.br";
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    console.warn(`AVISO: já existe User pra ${email}, pulando resolução Cecilia/Sekai.`);
    return;
  }

  const cecilia = await prisma.gestor.findFirst({ where: { nome: "CECILIA UDA" } });
  const sekai = await prisma.gestor.findFirst({
    where: { nome: "SEKAI" },
    include: { bases: true, promotores: { select: { id: true } } },
  });
  const promotor = await prisma.promotor.findFirst({
    where: { nome: "CECILIA UDA", userId: null },
  });

  if (!cecilia) {
    console.warn('AVISO: Gestor "CECILIA UDA" não encontrado — nada a fazer.');
    return;
  }
  if (cecilia.userId) {
    console.warn('AVISO: Gestor "CECILIA UDA" já tem userId — pulando resolução Sekai.');
    return;
  }

  // Mescla SEKAI (nome errado/duplicado, mesma pessoa que CECILIA UDA,
  // confirmado com o Vinicius em 2026-08-05) em CECILIA UDA antes de criar
  // o login: reatribui as bases e os Executivos que SEKAI gerenciava, só
  // então apaga a linha SEKAI — Gestor.userId é @unique, então as duas
  // linhas não podiam continuar existindo com login.
  if (sekai) {
    await prisma.$transaction(async (tx) => {
      for (const gestorBase of sekai.bases) {
        const conflito = await tx.gestorBase.findUnique({
          where: { gestorId_baseId: { gestorId: cecilia.id, baseId: gestorBase.baseId } },
        });
        if (conflito) {
          await tx.gestorBase.delete({ where: { id: gestorBase.id } });
        } else {
          await tx.gestorBase.update({
            where: { id: gestorBase.id },
            data: { gestorId: cecilia.id },
          });
        }
      }

      if (sekai.promotores.length > 0) {
        await tx.promotor.updateMany({
          where: { id: { in: sekai.promotores.map((p) => p.id) } },
          data: { gestorId: cecilia.id },
        });
      }

      await tx.gestor.delete({ where: { id: sekai.id } });
    });
    console.warn(
      `OK: gestor "SEKAI" (${sekai.id}) mesclado em "CECILIA UDA" — ${sekai.bases.length} base(s), ${sekai.promotores.length} executivo(s) reatribuído(s), linha apagada.`,
    );
  }

  await criarUsuarioEVincular({
    nome: "CECILIA UDA",
    email,
    telefone: sekai?.telefone ?? cecilia.telefone ?? null,
    gestorIds: [cecilia.id],
    promotorIds: promotor ? [promotor.id] : [],
    passwordHash,
    welcomeEmailSender,
  });
}

async function criarUsuarioEVincular(args: {
  nome: string;
  email: string;
  telefone: string | null;
  gestorIds: string[];
  promotorIds?: string[];
  passwordHash: string;
  welcomeEmailSender: WelcomeEmailSender;
}): Promise<void> {
  const {
    nome,
    email,
    telefone,
    gestorIds,
    promotorIds = [],
    passwordHash,
    welcomeEmailSender,
  } = args;
  const { firstName, lastName } = partirNome(nome);

  // Mesma pessoa pode ter um Executivo homônimo com o mesmo e-mail ainda
  // sem userId — linka os dois ao mesmo User em vez de deixar o Executivo
  // esquecido (Gestor tem prioridade, Executivo é espelho).
  const promotorEspelho = await prisma.promotor.findFirst({
    where: { email, userId: null, id: { notIn: promotorIds } },
    select: { id: true },
  });
  const todosPromotorIds = promotorEspelho ? [...promotorIds, promotorEspelho.id] : promotorIds;

  const user = await prisma.$transaction(async (tx) => {
    const novoUser = await tx.user.create({
      data: {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
        phone: telefone ?? "",
        cargo: "GESTOR",
        password: passwordHash,
        mustChangePassword: true,
      },
    });

    for (const gestorId of gestorIds) {
      await tx.gestor.update({ where: { id: gestorId }, data: { userId: novoUser.id } });
    }
    for (const promotorId of todosPromotorIds) {
      await tx.promotor.update({ where: { id: promotorId }, data: { userId: novoUser.id } });
    }

    return novoUser;
  });

  console.warn(
    `OK: User ${user.id} criado pra "${nome}" (${email}) — ${gestorIds.length} gestor(es), ${todosPromotorIds.length} executivo(s) espelho.`,
  );

  try {
    await welcomeEmailSender.send({ to: email, firstName, temporaryPassword: SENHA_TEMPORARIA });
  } catch (error) {
    console.error(`Falha ao enviar e-mail de boas-vindas pra ${email}:`, error);
  }
}

main()
  .catch((error) => {
    console.error("Falha ao criar acesso dos gestores:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
