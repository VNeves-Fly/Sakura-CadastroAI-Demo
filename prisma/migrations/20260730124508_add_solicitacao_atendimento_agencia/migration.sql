-- CreateEnum
CREATE TYPE "TipoSolicitacaoAtendimentoAgencia" AS ENUM ('TRANSFERENCIA', 'ASSUNCAO');

-- CreateEnum
CREATE TYPE "StatusSolicitacaoAtendimentoAgencia" AS ENUM ('PENDENTE', 'ACEITA', 'CANCELADA');

-- CreateTable
CREATE TABLE "solicitacoes_atendimento_agencia" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "tipo" "TipoSolicitacaoAtendimentoAgencia" NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "atendenteAtualId" TEXT NOT NULL,
    "novoAtendenteId" TEXT NOT NULL,
    "status" "StatusSolicitacaoAtendimentoAgencia" NOT NULL DEFAULT 'PENDENTE',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidaEm" TIMESTAMP(3),
    "resolvidaPorExpiracao" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "solicitacoes_atendimento_agencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitacoes_atendimento_agencia_agenciaId_idx" ON "solicitacoes_atendimento_agencia"("agenciaId");

-- CreateIndex
CREATE INDEX "solicitacoes_atendimento_agencia_solicitanteId_idx" ON "solicitacoes_atendimento_agencia"("solicitanteId");

-- CreateIndex
CREATE INDEX "solicitacoes_atendimento_agencia_atendenteAtualId_idx" ON "solicitacoes_atendimento_agencia"("atendenteAtualId");

-- CreateIndex
CREATE INDEX "solicitacoes_atendimento_agencia_novoAtendenteId_idx" ON "solicitacoes_atendimento_agencia"("novoAtendenteId");

-- AddForeignKey
ALTER TABLE "solicitacoes_atendimento_agencia" ADD CONSTRAINT "solicitacoes_atendimento_agencia_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_atendimento_agencia" ADD CONSTRAINT "solicitacoes_atendimento_agencia_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_atendimento_agencia" ADD CONSTRAINT "solicitacoes_atendimento_agencia_atendenteAtualId_fkey" FOREIGN KEY ("atendenteAtualId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_atendimento_agencia" ADD CONSTRAINT "solicitacoes_atendimento_agencia_novoAtendenteId_fkey" FOREIGN KEY ("novoAtendenteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
