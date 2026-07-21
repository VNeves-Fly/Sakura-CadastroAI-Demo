-- CreateTable
CREATE TABLE "analises_ia_agencias" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "parecer" TEXT,
    "motivo" TEXT,
    "flagsRisco" TEXT[],
    "detalhamento" JSONB,
    "avaliadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_ia_agencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analises_ia_agencias_agenciaId_key" ON "analises_ia_agencias"("agenciaId");

-- AddForeignKey
ALTER TABLE "analises_ia_agencias" ADD CONSTRAINT "analises_ia_agencias_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
