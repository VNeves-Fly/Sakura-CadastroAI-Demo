-- CreateEnum
CREATE TYPE "StatusSolicitacaoTransferencia" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA', 'EXPIRADA');

-- AlterTable
ALTER TABLE "templates_whatsapp" ADD COLUMN     "motivoRejeicao" TEXT;

-- CreateTable
CREATE TABLE "solicitacoes_transferencia" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "deAnalistaId" TEXT NOT NULL,
    "paraAnalistaId" TEXT NOT NULL,
    "status" "StatusSolicitacaoTransferencia" NOT NULL DEFAULT 'PENDENTE',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidaEm" TIMESTAMP(3),
    "limpaEm" TIMESTAMP(3),

    CONSTRAINT "solicitacoes_transferencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitacoes_transferencia_conversaId_idx" ON "solicitacoes_transferencia"("conversaId");

-- AddForeignKey
ALTER TABLE "solicitacoes_transferencia" ADD CONSTRAINT "solicitacoes_transferencia_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_transferencia" ADD CONSTRAINT "solicitacoes_transferencia_deAnalistaId_fkey" FOREIGN KEY ("deAnalistaId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_transferencia" ADD CONSTRAINT "solicitacoes_transferencia_paraAnalistaId_fkey" FOREIGN KEY ("paraAnalistaId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
