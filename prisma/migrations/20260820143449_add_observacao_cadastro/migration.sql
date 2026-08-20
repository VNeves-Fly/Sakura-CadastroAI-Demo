-- CreateTable
CREATE TABLE "observacoes_cadastro" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "registradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observacoes_cadastro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "observacoes_cadastro_agenciaId_idx" ON "observacoes_cadastro"("agenciaId");

-- AddForeignKey
ALTER TABLE "observacoes_cadastro" ADD CONSTRAINT "observacoes_cadastro_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
