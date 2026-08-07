/*
  Warnings:

  - You are about to drop the `kanban_historico` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "kanban_historico" DROP CONSTRAINT "kanban_historico_agenciaId_fkey";

-- DropTable
DROP TABLE "kanban_historico";

-- CreateTable
CREATE TABLE "historico_etapa_cadastro" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "statusAnterior" "StatusAgencia",
    "statusNovo" "StatusAgencia",
    "usuarioEmail" TEXT,
    "origem" TEXT,
    "observacao" TEXT,
    "desbloqueioManual" BOOLEAN,
    "detalhes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_etapa_cadastro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historico_etapa_cadastro_agenciaId_idx" ON "historico_etapa_cadastro"("agenciaId");

-- AddForeignKey
ALTER TABLE "historico_etapa_cadastro" ADD CONSTRAINT "historico_etapa_cadastro_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
