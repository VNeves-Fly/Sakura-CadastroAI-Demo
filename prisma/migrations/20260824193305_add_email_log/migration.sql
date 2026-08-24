-- CreateEnum
CREATE TYPE "DisparoEmail" AS ENUM ('manual', 'automatico');

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "disparo" "DisparoEmail" NOT NULL,
    "agenciaId" TEXT,
    "sucesso" BOOLEAN NOT NULL,
    "erro" TEXT,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_logs_agenciaId_idx" ON "email_logs"("agenciaId");

-- CreateIndex
CREATE INDEX "email_logs_enviadoEm_idx" ON "email_logs"("enviadoEm");

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
