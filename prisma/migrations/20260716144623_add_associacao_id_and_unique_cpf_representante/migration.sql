-- DropIndex
DROP INDEX "representantes_legais_cadastroId_idx";

-- AlterTable
ALTER TABLE "cadastros" ADD COLUMN     "associacaoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "representantes_legais_cadastroId_cpf_key" ON "representantes_legais"("cadastroId", "cpf");

