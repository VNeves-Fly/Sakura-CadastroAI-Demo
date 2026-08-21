-- CreateEnum
CREATE TYPE "StatusBiometriaVerificacao" AS ENUM ('pendente', 'aprovado', 'reprovado', 'analise_manual');

-- AlterTable
ALTER TABLE "agencias" ADD COLUMN     "gateBiometriaAtivo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "biometria_verificacoes" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "StatusBiometriaVerificacao" NOT NULL DEFAULT 'pendente',
    "sessionId" TEXT,
    "personId" TEXT,
    "tentativasLembrete" INTEGER NOT NULL DEFAULT 0,
    "linkEnviadoEm" TIMESTAMP(3),
    "resolvidoEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometria_verificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "biometria_verificacoes_token_key" ON "biometria_verificacoes"("token");

-- CreateIndex
CREATE UNIQUE INDEX "biometria_verificacoes_contratoId_email_key" ON "biometria_verificacoes"("contratoId", "email");

-- AddForeignKey
ALTER TABLE "biometria_verificacoes" ADD CONSTRAINT "biometria_verificacoes_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
