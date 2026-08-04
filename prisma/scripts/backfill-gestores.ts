import { Prisma } from "@prisma/client";
import { prisma } from "@/modules/shared/infrastructure/prisma/client";

// `$queryRaw` não qualifica schema automaticamente (isso só vale pros
// métodos tipados do Prisma) — precisa apontar pro schema certo na mão,
// senão resolve contra o search_path padrão da conexão (public) e falha com
// "relation does not exist" mesmo a tabela existindo em outro schema. Mesmo
// parsing de `?schema=` que src/modules/shared/infrastructure/prisma/client.ts
// já faz pro adapter.
const schema = process.env.DATABASE_URL
  ? (new URL(process.env.DATABASE_URL).searchParams.get("schema") ?? "public")
  : "public";
const TABELA_PROMOTORES = Prisma.raw(`"${schema}"."promotores"`);

// Backfill único (não é seed) — cria um Gestor real (model novo, 2026-08-03)
// pra cada nome distinto ainda gravado na coluna legada `promotores.gestor`,
// e liga Promotor.gestorId a ele. Lido via SQL cru ($queryRaw) de propósito:
// a coluna `gestor` já não existe em schema.prisma (removida pela migration
// 20260803175831_drop_promotor_gestor_legado) — este script só funciona
// rodado CONTRA UM BANCO onde essa migration AINDA NÃO foi aplicada, ou
// seja, entre `20260803172756_add_gestor_hierarquia` (que cria gestorId) e
// a migration que remove a coluna. Em produção: aplicar só a primeira
// migration, rodar este script, confirmar 0 promotores com gestorId nulo,
// só então aplicar a migration que remove a coluna (ver runbook de deploy).
// Match EXATO de string, sem fuzzy matching (mesma filosofia de
// agregacoes.util.ts/seeds/promotores.ts). Idempotente.
//
// Uso: DATABASE_URL=... bun run prisma/scripts/backfill-gestores.ts
async function main() {
  const promotoresSemGestorId = await prisma.$queryRaw<Array<{ id: string; gestor: string }>>(
    Prisma.sql`SELECT id, gestor FROM ${TABELA_PROMOTORES} WHERE "gestorId" IS NULL`,
  );

  const idsPorNome = new Map<string, string[]>();
  for (const promotor of promotoresSemGestorId) {
    const nome = promotor.gestor.trim();
    if (!nome) continue;
    const ids = idsPorNome.get(nome) ?? [];
    ids.push(promotor.id);
    idsPorNome.set(nome, ids);
  }

  console.warn(
    `Encontrados ${promotoresSemGestorId.length} promotor(es) sem gestorId, ${idsPorNome.size} nome(s) de gestor distinto(s).`,
  );

  let gestoresCriados = 0;
  let promotoresVinculados = 0;

  for (const [nome, ids] of [...idsPorNome.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    let gestor = await prisma.gestor.findFirst({ where: { nome } });
    if (!gestor) {
      gestor = await prisma.gestor.create({ data: { nome } });
      gestoresCriados += 1;
    }

    const { count } = await prisma.promotor.updateMany({
      where: { id: { in: ids }, gestorId: null },
      data: { gestorId: gestor.id },
    });
    promotoresVinculados += count;

    console.warn(`OK: "${nome}" -> Gestor ${gestor.id} (${count} promotor(es) vinculado(s))`);
  }

  const semNomeValido = promotoresSemGestorId.length - promotoresVinculados;

  console.warn(
    `Concluído: ${gestoresCriados} gestor(es) criado(s), ${promotoresVinculados} promotor(es) vinculado(s)` +
      (semNomeValido > 0
        ? `, ${semNomeValido} promotor(es) com gestor em branco ficaram sem gestorId.`
        : "."),
  );
}

main()
  .catch((error) => {
    console.error("Falha no backfill:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
