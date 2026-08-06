import bcrypt from "bcryptjs";
import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { createWelcomeEmailSender } from "@/modules/users/infrastructure/factories/welcome-email-sender.factory";
import type { WelcomeEmailSender } from "@/modules/users/domain/services/welcome-email-sender";
import { partirNome } from "@/modules/gestores/utils/partir-nome.util";

// Mesma rodada de acesso do criar-acesso-gestores.ts, agora do lado
// Executivo (Cargo.EXECUTIVO) — senha temporária Sakura@2026,
// mustChangePassword = true, confirmado com o Vinicius em 2026-08-05.
//
// Casos especiais resolvidos antes do loop genérico:
// - "PC - PAULO CESAR": duplicado (paulo.cesar@ e pc.paulo.cesar@), sem
//   base/agência em nenhuma das duas linhas — mescla sem perda, mantendo
//   a linha com sica/link preenchidos e apagando a outra.
// - "SANDRO MAROTA / GILBERTO GRUDKA": linha legada com nome/e-mail de
//   DUAS pessoas juntos (tem base + 3 agências atribuídas, sem como saber
//   automaticamente o que é de cada um) — pulado de propósito, precisa de
//   decisão manual pra separar. Sandro já tem linha própria e conta
//   (espelhada do Gestor "SANDRO MAROTA" em 2026-08-05).
// - CONECTA / SUPORTE COMERCIAL: e-mail real e já funcionam como
//   executivo de verdade (sica + link de cadastro) — tratados como
//   qualquer outro, confirmado com o Vinicius.
//
// Regra geral (loop): Gestor tem prioridade sobre Executivo (mesma regra
// do criar-acesso-gestores.ts) — se já existe um Gestor homônimo/mesmo
// e-mail com userId, só linka o Executivo a esse User em vez de criar
// conta nova. Linhas com e-mail inválido pra login (placeholder
// "@sakuratur.invalid" ou string combinada com "/") são puladas.
//
// Idempotente (só cria/linka onde userId ainda é null).
//
// Uso: DATABASE_URL=... DATABASE_CA_CERT=... bun run prisma/scripts/criar-acesso-executivos.ts
const SENHA_TEMPORARIA = "Sakura@2026";
const SALT_ROUNDS = 10;

async function main() {
  const welcomeEmailSender = createWelcomeEmailSender();
  const passwordHash = await bcrypt.hash(SENHA_TEMPORARIA, SALT_ROUNDS);

  await mesclarPcPauloCesar();

  const promotores = await prisma.promotor.findMany({
    where: { userId: null },
    select: { id: true, nome: true, email: true, telefone: true },
    orderBy: { nome: "asc" },
  });

  let criados = 0;
  let linkados = 0;
  let pulados = 0;

  for (const promotor of promotores) {
    const email = promotor.email?.trim().toLowerCase();
    if (!email || email.endsWith("@sakuratur.invalid") || email.includes("/")) {
      console.warn(
        `PULANDO executivo "${promotor.nome}" — e-mail não utilizável (${promotor.email ?? "NULL"}).`,
      );
      pulados += 1;
      continue;
    }

    // Gestor tem prioridade — se um Gestor homônimo (nome ou e-mail) já
    // tem login, o Executivo é só espelho: linka ao mesmo User em vez de
    // criar conta nova.
    const gestorComAcesso = await prisma.gestor.findFirst({
      where: { userId: { not: null }, OR: [{ nome: promotor.nome }, { email }] },
      select: { userId: true },
    });
    if (gestorComAcesso?.userId) {
      await prisma.promotor.update({
        where: { id: promotor.id },
        data: { userId: gestorComAcesso.userId },
      });
      console.warn(
        `OK: executivo "${promotor.nome}" linkado ao User ${gestorComAcesso.userId} (já existente via Gestor).`,
      );
      linkados += 1;
      continue;
    }

    await criarUsuarioEVincular({
      nome: promotor.nome,
      email,
      telefone: promotor.telefone,
      promotorIds: [promotor.id],
      passwordHash,
      welcomeEmailSender,
    });
    criados += 1;
  }

  console.warn(
    `Concluído: ${criados} conta(s) nova(s) criada(s), ${linkados} linkado(s) a Gestor existente, ${pulados} executivo(s) pulado(s).`,
  );
}

async function mesclarPcPauloCesar(): Promise<void> {
  const linhas = await prisma.promotor.findMany({
    where: { nome: "PC - PAULO CESAR" },
    include: { bases: true, agenciasAtribuidas: { select: { id: true } } },
  });
  if (linhas.length < 2) return;

  const manter = linhas.find((linha) => linha.sica !== null) ?? linhas[0];
  const apagar = linhas.filter((linha) => linha.id !== manter?.id);

  for (const linha of apagar) {
    if (linha.bases.length > 0 || linha.agenciasAtribuidas.length > 0 || linha.userId) {
      console.warn(
        `AVISO: "PC - PAULO CESAR" (${linha.id}) tem base/agência/userId — não mesclando automaticamente, revisar manualmente.`,
      );
      return;
    }
    await prisma.promotor.delete({ where: { id: linha.id } });
  }

  console.warn(
    `OK: "PC - PAULO CESAR" mesclado — mantida ${manter?.id} (${manter?.email}), ${apagar.length} duplicata(s) apagada(s).`,
  );
}

async function criarUsuarioEVincular(args: {
  nome: string;
  email: string;
  telefone: string | null;
  promotorIds: string[];
  passwordHash: string;
  welcomeEmailSender: WelcomeEmailSender;
}): Promise<void> {
  const { nome, email, telefone, promotorIds, passwordHash, welcomeEmailSender } = args;
  const { firstName, lastName } = partirNome(nome);

  // Mesma pessoa pode ter um Gestor homônimo com o mesmo e-mail ainda sem
  // userId — linka os dois ao mesmo User em vez de deixar o Gestor
  // esquecido (mesma regra de espelhamento do criar-acesso-gestores.ts).
  const gestorEspelho = await prisma.gestor.findFirst({
    where: { email, userId: null },
    select: { id: true },
  });

  const user = await prisma.$transaction(async (tx) => {
    const novoUser = await tx.user.create({
      data: {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
        phone: telefone ?? "",
        cargo: "EXECUTIVO",
        password: passwordHash,
        mustChangePassword: true,
      },
    });

    for (const promotorId of promotorIds) {
      await tx.promotor.update({ where: { id: promotorId }, data: { userId: novoUser.id } });
    }
    if (gestorEspelho) {
      await tx.gestor.update({ where: { id: gestorEspelho.id }, data: { userId: novoUser.id } });
    }

    return novoUser;
  });

  console.warn(
    `OK: User ${user.id} criado pra "${nome}" (${email}) — ${promotorIds.length} executivo(s)${gestorEspelho ? ", 1 gestor espelho" : ""}.`,
  );

  try {
    await welcomeEmailSender.send({ to: email, firstName, temporaryPassword: SENHA_TEMPORARIA });
  } catch (error) {
    console.error(`Falha ao enviar e-mail de boas-vindas pra ${email}:`, error);
  }
}

main()
  .catch((error) => {
    console.error("Falha ao criar acesso dos executivos:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
