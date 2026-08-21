/*
  Warnings:

  - Added the required column `agenciaId` to the `biometria_verificacoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "biometria_verificacoes" ADD COLUMN     "agenciaId" TEXT NOT NULL;
