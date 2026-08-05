import { Prisma } from "@prisma/client";
import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { lerCsvLegado } from "./lib/csv-legado.util";

// Importa as Bases reais do banco antigo (docs/db/bkp/bases-export-*.csv,
// preserva o uuid do export, mesmo padrão de Associacao/Promotor) e faz o
// backfill de GestorBase/PromotorBase.baseId a partir do baseSigla já
// existente — cobertura 100% confirmada manualmente antes de escrever isso
// (todo baseSigla hoje em uso bate com uma sigla do export). Idempotente.
//
// `baseSigla` já não existe em schema.prisma (removida pela migration
// "drop_base_sigla_legado") — lida via SQL cru ($queryRaw, schema-
// qualificado — $queryRaw não respeita `?schema=`, ver
// [[prod_migration_gotchas_pg_prisma]]), igual ao backfill de gestores
// antes. Só funciona rodado ANTES dessa migration de contract (ou seja:
// aplicar só a migration aditiva, rodar este script, só então aplicar a
// que remove a coluna — mesmo runbook de sempre).
//
// Uso: DATABASE_URL=... bun run prisma/scripts/importar-bases.ts
const schema = process.env.DATABASE_URL
  ? (new URL(process.env.DATABASE_URL).searchParams.get("schema") ?? "public")
  : "public";
const TABELA_GESTOR_BASES = Prisma.raw(`"${schema}"."gestor_bases"`);
const TABELA_PROMOTOR_BASES = Prisma.raw(`"${schema}"."promotor_bases"`);
async function main() {
  const linhas = lerCsvLegado("bases-export");

  for (const linha of linhas) {
    await prisma.base.upsert({
      where: { id: linha.id },
      update: {
        sigla: linha.sigla,
        nomeCidade: linha.nome_cidade,
        uf: linha.uf,
        regiaoIdLegado: linha.regiao_id || null,
      },
      create: {
        id: linha.id,
        sigla: linha.sigla ?? "",
        nomeCidade: linha.nome_cidade ?? "",
        uf: linha.uf ?? "",
        regiaoIdLegado: linha.regiao_id || null,
      },
    });
  }

  const totalBases = await prisma.base.count();
  console.warn(`Bases: ${linhas.length} linha(s) no CSV, ${totalBases} no banco após upsert.`);

  const gestorBasesAtualizadas = await backfillBaseId("gestorBase");
  const promotorBasesAtualizadas = await backfillBaseId("promotorBase");

  console.warn(
    `Backfill baseId: ${gestorBasesAtualizadas} gestor_bases, ${promotorBasesAtualizadas} promotor_bases.`,
  );

  const gestorBasesSemBaseId = await contarSemBaseId(TABELA_GESTOR_BASES);
  const promotorBasesSemBaseId = await contarSemBaseId(TABELA_PROMOTOR_BASES);
  console.warn(
    `Restam sem baseId: ${gestorBasesSemBaseId} gestor_bases, ${promotorBasesSemBaseId} promotor_bases` +
      (gestorBasesSemBaseId + promotorBasesSemBaseId === 0
        ? " — OK pra aplicar a migration de contract."
        : " — NÃO aplicar a migration de contract ainda, investigar essas siglas órfãs primeiro."),
  );
}

async function contarSemBaseId(tabela: Prisma.Sql): Promise<number> {
  const [linha] = await prisma.$queryRaw<Array<{ total: bigint }>>(
    Prisma.sql`SELECT count(*) AS total FROM ${tabela} WHERE "baseId" IS NULL`,
  );
  return Number(linha?.total ?? 0);
}

async function backfillBaseId(modelo: "gestorBase" | "promotorBase"): Promise<number> {
  const bases = await prisma.base.findMany({ select: { id: true, sigla: true } });
  const idPorSigla = new Map(bases.map((base) => [base.sigla, base.id]));
  const tabela = modelo === "gestorBase" ? TABELA_GESTOR_BASES : TABELA_PROMOTOR_BASES;
  const nomeTabelaLog = modelo === "gestorBase" ? "gestor_base" : "promotor_base";

  const semBaseId = await prisma.$queryRaw<Array<{ id: string; baseSigla: string }>>(
    Prisma.sql`SELECT id, "baseSigla" FROM ${tabela} WHERE "baseId" IS NULL`,
  );

  let total = 0;
  for (const registro of semBaseId) {
    const baseId = idPorSigla.get(registro.baseSigla);
    if (!baseId) {
      console.warn(
        `AVISO: ${nomeTabelaLog} ${registro.id} tem baseSigla "${registro.baseSigla}" sem Base correspondente — pulando.`,
      );
      continue;
    }
    if (modelo === "gestorBase") {
      await prisma.gestorBase.update({ where: { id: registro.id }, data: { baseId } });
    } else {
      await prisma.promotorBase.update({ where: { id: registro.id }, data: { baseId } });
    }
    total += 1;
  }
  return total;
}

main()
  .catch((error) => {
    console.error("Falha ao importar bases:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
