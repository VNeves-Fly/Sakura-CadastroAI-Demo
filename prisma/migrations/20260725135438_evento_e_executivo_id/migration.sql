/*
  Warnings:

  - You are about to drop the column `promotorLinkId` on the `agencias` table. All the data in the column will be lost.

  Backfill: antes de dropar `promotorLinkId`, resolve o uuid cru (que
  aponta pra um item de `promotores.linkExecutivoId`) pro id real do
  Promotor e grava em `executivoId` — ver
  src/modules/cadastro/infrastructure/repositories/prisma-executivo-resolver.ts
  pra resolução equivalente em runtime (links de evento novos, que já
  chegam com o Promotor.id direto).
*/
-- AlterTable
ALTER TABLE "agencias"
  ADD COLUMN     "eventoId" TEXT,
  ADD COLUMN     "executivoId" TEXT;

-- Backfill: promotorLinkId (uuid cru do link pessoal) -> executivoId (id real do Promotor)
UPDATE "agencias" a
SET "executivoId" = p."id"
FROM "promotores" p
WHERE a."promotorLinkId" IS NOT NULL
  AND a."promotorLinkId" = ANY(p."linkExecutivoId");

-- AlterTable
ALTER TABLE "agencias" DROP COLUMN "promotorLinkId";

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_links" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "promotorId" TEXT,
    "associacaoId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_links_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "agencias" ADD CONSTRAINT "agencias_executivoId_fkey" FOREIGN KEY ("executivoId") REFERENCES "promotores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencias" ADD CONSTRAINT "agencias_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_links" ADD CONSTRAINT "evento_links_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_links" ADD CONSTRAINT "evento_links_promotorId_fkey" FOREIGN KEY ("promotorId") REFERENCES "promotores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_links" ADD CONSTRAINT "evento_links_associacaoId_fkey" FOREIGN KEY ("associacaoId") REFERENCES "associacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
