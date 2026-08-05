
-- DropForeignKey
ALTER TABLE "gestor_bases" DROP CONSTRAINT "gestor_bases_baseId_fkey";

-- DropForeignKey
ALTER TABLE "promotor_bases" DROP CONSTRAINT "promotor_bases_baseId_fkey";

-- DropIndex
DROP INDEX "gestor_bases_baseId_idx";

-- DropIndex
DROP INDEX "gestor_bases_baseSigla_idx";

-- DropIndex
DROP INDEX "gestor_bases_gestorId_baseSigla_key";

-- DropIndex
DROP INDEX "promotor_bases_baseId_idx";

-- DropIndex
DROP INDEX "promotor_bases_baseSigla_idx";

-- DropIndex
DROP INDEX "promotor_bases_promotorId_baseSigla_key";

-- AlterTable
ALTER TABLE "gestor_bases" DROP COLUMN "baseSigla",
ALTER COLUMN "baseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "promotor_bases" DROP COLUMN "baseSigla",
ALTER COLUMN "baseId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "gestor_bases_gestorId_baseId_key" ON "gestor_bases"("gestorId", "baseId");

-- CreateIndex
CREATE UNIQUE INDEX "promotor_bases_promotorId_baseId_key" ON "promotor_bases"("promotorId", "baseId");

-- AddForeignKey
ALTER TABLE "gestor_bases" ADD CONSTRAINT "gestor_bases_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotor_bases" ADD CONSTRAINT "promotor_bases_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

