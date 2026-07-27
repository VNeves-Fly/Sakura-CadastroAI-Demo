-- AlterTable
ALTER TABLE "documentos" ADD COLUMN     "aprovadoEm" TIMESTAMP(3),
ADD COLUMN     "aprovadoPor" TEXT,
ADD COLUMN     "inseridoManualmentePor" TEXT,
ADD COLUMN     "motivoAprovacao" TEXT;

-- CreateTable
CREATE TABLE "historico_edicoes_cadastro" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "alteracoes" JSONB NOT NULL,
    "justificativa" TEXT NOT NULL,
    "editadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_edicoes_cadastro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historico_edicoes_cadastro_agenciaId_idx" ON "historico_edicoes_cadastro"("agenciaId");

-- CreateIndex
CREATE INDEX "historico_edicoes_cadastro_entidadeId_idx" ON "historico_edicoes_cadastro"("entidadeId");

-- AddForeignKey
ALTER TABLE "historico_edicoes_cadastro" ADD CONSTRAINT "historico_edicoes_cadastro_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
