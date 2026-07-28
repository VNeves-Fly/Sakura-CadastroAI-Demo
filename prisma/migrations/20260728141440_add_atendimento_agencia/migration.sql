-- CreateTable
CREATE TABLE "atendimentos_agencia" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "analistaId" TEXT NOT NULL,
    "assumidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liberadoEm" TIMESTAMP(3),

    CONSTRAINT "atendimentos_agencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "atendimentos_agencia_agenciaId_idx" ON "atendimentos_agencia"("agenciaId");

-- AddForeignKey
ALTER TABLE "atendimentos_agencia" ADD CONSTRAINT "atendimentos_agencia_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_agencia" ADD CONSTRAINT "atendimentos_agencia_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
