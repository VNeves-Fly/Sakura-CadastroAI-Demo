
-- AlterTable
ALTER TABLE "gestor_bases" ADD COLUMN     "baseId" TEXT;

-- AlterTable
ALTER TABLE "promotor_bases" ADD COLUMN     "baseId" TEXT;

-- CreateTable
CREATE TABLE "bases" (
    "id" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "nomeCidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "regiaoIdLegado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bases_sigla_key" ON "bases"("sigla");

-- CreateIndex
CREATE INDEX "gestor_bases_baseId_idx" ON "gestor_bases"("baseId");

-- CreateIndex
CREATE INDEX "promotor_bases_baseId_idx" ON "promotor_bases"("baseId");

-- AddForeignKey
ALTER TABLE "gestor_bases" ADD CONSTRAINT "gestor_bases_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotor_bases" ADD CONSTRAINT "promotor_bases_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

