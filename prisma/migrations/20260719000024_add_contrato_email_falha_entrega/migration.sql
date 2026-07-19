-- CreateTable
CREATE TABLE "contrato_email_falha_entrega" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contrato_email_falha_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contrato_email_falha_entrega_contratoId_email_key" ON "contrato_email_falha_entrega"("contratoId", "email");

-- AddForeignKey
ALTER TABLE "contrato_email_falha_entrega" ADD CONSTRAINT "contrato_email_falha_entrega_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
