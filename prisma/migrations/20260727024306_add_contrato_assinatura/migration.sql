-- CreateTable
CREATE TABLE "contrato_assinaturas" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "assinadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contrato_assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contrato_assinaturas_contratoId_email_key" ON "contrato_assinaturas"("contratoId", "email");

-- AddForeignKey
ALTER TABLE "contrato_assinaturas" ADD CONSTRAINT "contrato_assinaturas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
