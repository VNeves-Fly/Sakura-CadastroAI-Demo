-- CreateEnum
CREATE TYPE "SicaEmpresaStatus" AS ENUM ('ativo', 'inativo');

-- CreateEnum
CREATE TYPE "SicaMetodoConsulta" AS ENUM ('cnpj', 'codigo_empresa');

-- CreateTable
CREATE TABLE "consultas_sst" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "erro" TEXT,
    "metodo" "SicaMetodoConsulta" NOT NULL,
    "encontrado" BOOLEAN NOT NULL,
    "codigoEmpresa" INTEGER,
    "nomeEmpresa" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "empresaStatus" "SicaEmpresaStatus",
    "codigoExecutivo" INTEGER,
    "nomeExecutivo" TEXT,
    "consultadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_sst_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultas_sst_agenciaId_idx" ON "consultas_sst"("agenciaId");

-- AddForeignKey
ALTER TABLE "consultas_sst" ADD CONSTRAINT "consultas_sst_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
