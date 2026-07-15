-- CreateTable
CREATE TABLE "agencias" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "etapaAtual" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'em_analise',
    "contratoSocialPath" TEXT NOT NULL,
    "emailContato" TEXT NOT NULL,
    "telefoneContato" TEXT NOT NULL,
    "origem" TEXT,
    "socios" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agencias_cnpj_key" ON "agencias"("cnpj");
