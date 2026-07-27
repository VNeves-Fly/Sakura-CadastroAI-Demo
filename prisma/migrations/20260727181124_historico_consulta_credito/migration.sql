-- CreateTable
CREATE TABLE "historico_consultas_credito" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "fonte" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "erro" TEXT,
    "resultado" JSONB,
    "rawResultado" JSONB,
    "consultadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_consultas_credito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historico_consultas_credito_agenciaId_fonte_idx" ON "historico_consultas_credito"("agenciaId", "fonte");

-- AddForeignKey
ALTER TABLE "historico_consultas_credito" ADD CONSTRAINT "historico_consultas_credito_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
