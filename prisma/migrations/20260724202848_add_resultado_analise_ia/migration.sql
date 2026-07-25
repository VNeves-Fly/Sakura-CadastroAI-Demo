/*
  Warnings:

  - Added the required column `resultado` to the `analises_ia_agencias` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResultadoAnaliseIa" AS ENUM ('APROVADO', 'REPROVADO', 'FALHA_ANALISE', 'FALHA_CONTRATO');

-- AlterTable
ALTER TABLE "analises_ia_agencias" ADD COLUMN     "resultado" "ResultadoAnaliseIa" NOT NULL;
