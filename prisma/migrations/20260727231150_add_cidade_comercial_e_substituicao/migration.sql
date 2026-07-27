-- CreateTable
CREATE TABLE "cidades_comerciais" (
    "id" TEXT NOT NULL,
    "regiao" TEXT,
    "estado" TEXT,
    "cidade" TEXT NOT NULL,
    "ddd" TEXT,
    "base" TEXT,
    "executivo" TEXT,
    "gestor" TEXT,
    "subregiaoSp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cidades_comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "substituicoes_atribuicoes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nomeAntigo" TEXT NOT NULL,
    "nomeNovo" TEXT NOT NULL,
    "totalCidadesAfetadas" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "substituicoes_atribuicoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cidades_comerciais_base_idx" ON "cidades_comerciais"("base");

-- CreateIndex
CREATE INDEX "cidades_comerciais_executivo_idx" ON "cidades_comerciais"("executivo");

-- CreateIndex
CREATE INDEX "cidades_comerciais_gestor_idx" ON "cidades_comerciais"("gestor");

-- CreateIndex
CREATE INDEX "cidades_comerciais_regiao_idx" ON "cidades_comerciais"("regiao");
