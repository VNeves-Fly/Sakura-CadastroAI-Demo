import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { lerCsvLegado } from "./lib/csv-legado.util";

// Reconcilia Gestor/Executivo com os exports reais do banco antigo
// (gerentes_conta = Gestor, gerentes_conta_bases, promotores = Executivo) —
// ao contrário do backfill anterior (por nome, aproximado), aqui o vínculo
// executivo -> gestor vem do gestor_id real (FK) do sistema antigo, muito
// mais preciso. Decisões confirmadas com o usuário (2026-08-04):
//   - NÃO cria acesso (User) em massa — só atualiza dado de negócio.
//   - Cria Executivo novo pra quem não existe ainda no nosso banco.
//   - Sobrescreve sempre o `sica` atual com codigo/codigo_executivo do
//     export, quando o export trouxer valor (nunca zera um sica existente
//     só porque a linha não tem código).
// Roda DEPOIS de prisma/scripts/importar-bases.ts (precisa de Base.id
// populado pra linkar GestorBase). Idempotente.
//
// Uso: DATABASE_URL=... bun run prisma/scripts/reconciliar-comercial-legado.ts

function nomeCompleto(nome: string, sobrenome: string): string {
  return `${nome} ${sobrenome}`.trim();
}

async function reconciliarGestores(): Promise<Map<string, string>> {
  const linhas = lerCsvLegado("gerentes_conta-export").filter((linha) => !linha.deletado_em);

  const gestoresAtuais = await prisma.gestor.findMany({ select: { id: true, nome: true } });
  const gestorIdPorNomeUpper = new Map(gestoresAtuais.map((g) => [g.nome.toUpperCase(), g.id]));

  const mapaGerenteIdParaGestorId = new Map<string, string>();
  let atualizados = 0;
  let criados = 0;

  for (const linha of linhas) {
    const nome = nomeCompleto(linha.nome ?? "", linha.sobrenome ?? "");
    if (!nome) continue;

    const email = linha.email || null;
    const telefone = linha.telefone || null;
    let gestorId = gestorIdPorNomeUpper.get(nome.toUpperCase());

    if (gestorId) {
      await prisma.gestor.update({ where: { id: gestorId }, data: { email, telefone } });
      atualizados += 1;
    } else {
      const novo = await prisma.gestor.create({ data: { nome, email, telefone } });
      gestorId = novo.id;
      gestorIdPorNomeUpper.set(nome.toUpperCase(), gestorId);
      criados += 1;
    }

    mapaGerenteIdParaGestorId.set(linha.id ?? "", gestorId);
  }

  console.warn(`Gestor: ${criados} criado(s), ${atualizados} atualizado(s).`);
  return mapaGerenteIdParaGestorId;
}

async function importarGestorBases(mapaGerenteIdParaGestorId: Map<string, string>): Promise<void> {
  const linhas = lerCsvLegado("gerentes_conta_bases-export");
  const basesExistentes = new Set(
    (await prisma.base.findMany({ select: { id: true } })).map((b) => b.id),
  );

  let vinculados = 0;
  let ignorados = 0;

  for (const linha of linhas) {
    const gestorId = mapaGerenteIdParaGestorId.get(linha.gerente_id ?? "");
    const baseId = linha.base_id ?? "";
    if (!gestorId || !basesExistentes.has(baseId)) {
      ignorados += 1;
      continue;
    }
    await prisma.gestorBase.upsert({
      where: { gestorId_baseId: { gestorId, baseId } },
      update: {},
      create: { gestorId, baseId },
    });
    vinculados += 1;
  }

  console.warn(
    `GestorBase: ${vinculados} vínculo(s) criado(s)/confirmado(s)` +
      (ignorados > 0
        ? `, ${ignorados} linha(s) ignorada(s) (gestor ou base não resolvidos).`
        : "."),
  );
}

interface LinhaPromotorAtiva {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  gestorId: string | null;
  sica: number | null;
  updatedAt: string;
}

function deduplicarPromotoresPorEmail(
  linhas: Record<string, string>[],
  mapaGerenteIdParaGestorId: Map<string, string>,
): LinhaPromotorAtiva[] {
  const porEmail = new Map<string, LinhaPromotorAtiva>();

  for (const linha of linhas) {
    if (linha.deletado_em || linha.ativo !== "true") continue;
    const email = linha.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) continue; // descarta placeholder tipo "w.s" sem domínio

    const candidata: LinhaPromotorAtiva = {
      id: linha.id ?? "",
      nome: nomeCompleto(linha.nome ?? "", linha.sobrenome ?? ""),
      email,
      telefone: linha.telefone || null,
      gestorId: mapaGerenteIdParaGestorId.get(linha.gestor_id ?? "") ?? null,
      sica:
        linha.codigo || linha.codigo_executivo
          ? Number(linha.codigo || linha.codigo_executivo)
          : null,
      updatedAt: linha.updated_at ?? "",
    };

    const existente = porEmail.get(email);
    if (!existente || candidata.updatedAt > existente.updatedAt) {
      porEmail.set(email, candidata);
    }
  }

  return [...porEmail.values()];
}

async function reconciliarPromotores(
  mapaGerenteIdParaGestorId: Map<string, string>,
): Promise<void> {
  const linhasBrutas = lerCsvLegado("promotores-export");
  const candidatas = deduplicarPromotoresPorEmail(linhasBrutas, mapaGerenteIdParaGestorId);

  const promotoresAtuais = await prisma.promotor.findMany({
    select: { id: true, email: true, sica: true },
  });
  const promotorPorEmail = new Map(promotoresAtuais.map((p) => [p.email.toLowerCase(), p]));
  const promotorIdPorSica = new Map(
    promotoresAtuais.filter((p) => p.sica !== null).map((p) => [p.sica as number, p.id]),
  );

  let atualizados = 0;
  let criados = 0;
  let semGestorResolvido = 0;
  const conflitosSica: string[] = [];

  for (const candidata of candidatas) {
    if (!candidata.gestorId) {
      semGestorResolvido += 1;
      continue;
    }

    const existente = promotorPorEmail.get(candidata.email);

    let sicaParaGravar: number | null | undefined = undefined;
    if (candidata.sica !== null) {
      const donoAtual = promotorIdPorSica.get(candidata.sica);
      if (donoAtual && donoAtual !== existente?.id) {
        conflitosSica.push(
          `SICA ${candidata.sica} (${candidata.email}) já pertence a outro promotor — pulado.`,
        );
      } else {
        sicaParaGravar = candidata.sica;
      }
    }

    if (existente) {
      await prisma.promotor.update({
        where: { id: existente.id },
        data: {
          telefone: candidata.telefone,
          gestorId: candidata.gestorId,
          ...(sicaParaGravar !== undefined ? { sica: sicaParaGravar } : {}),
        },
      });
      atualizados += 1;
    } else {
      const novo = await prisma.promotor.create({
        data: {
          nome: candidata.nome,
          email: candidata.email,
          telefone: candidata.telefone,
          gestorId: candidata.gestorId,
          sica: sicaParaGravar ?? null,
        },
      });
      promotorPorEmail.set(candidata.email, { id: novo.id, email: novo.email, sica: novo.sica });
      if (novo.sica !== null) promotorIdPorSica.set(novo.sica, novo.id);
      criados += 1;
    }
  }

  console.warn(`Promotor: ${criados} criado(s), ${atualizados} atualizado(s).`);
  if (semGestorResolvido > 0) {
    console.warn(`AVISO: ${semGestorResolvido} promotor(es) sem gestor_id resolvido — pulado(s).`);
  }
  if (conflitosSica.length > 0) {
    console.warn(`AVISO: ${conflitosSica.length} conflito(s) de SICA:`);
    conflitosSica.forEach((linha) => console.warn(`  - ${linha}`));
  }
}

async function reportarGestoresOrfaos(): Promise<void> {
  const gestores = await prisma.gestor.findMany({
    select: { id: true, nome: true, _count: { select: { promotores: true } } },
  });
  const orfaos = gestores.filter((g) => g._count.promotores === 0);

  if (orfaos.length > 0) {
    console.warn(
      `AVISO: ${orfaos.length} gestor(es) ficaram sem nenhum executivo — possível duplicata de nome (ex.: apelido vs nome completo da mesma pessoa), revisar manualmente:`,
    );
    orfaos.forEach((g) => console.warn(`  - ${g.nome} (${g.id})`));
  } else {
    console.warn("Nenhum gestor órfão (todos têm ao menos 1 executivo).");
  }
}

async function main() {
  const mapaGerenteIdParaGestorId = await reconciliarGestores();
  await importarGestorBases(mapaGerenteIdParaGestorId);
  await reconciliarPromotores(mapaGerenteIdParaGestorId);
  await reportarGestoresOrfaos();
}

main()
  .catch((error) => {
    console.error("Falha na reconciliação:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
