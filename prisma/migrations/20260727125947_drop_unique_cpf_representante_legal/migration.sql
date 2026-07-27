-- DropIndex
DROP INDEX "representantes_legais_agenciaId_cpf_key";

-- CreateIndex
CREATE INDEX "representantes_legais_agenciaId_cpf_idx" ON "representantes_legais"("agenciaId", "cpf");
