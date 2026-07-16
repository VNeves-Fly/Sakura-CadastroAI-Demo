-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "provedorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando_assinatura',
    "signatarios" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
