/*
  Warnings:

  - You are about to drop the column `socios` on the `agencias` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "agencias" DROP COLUMN "socios";

-- CreateTable
CREATE TABLE "cadastros_complementares" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "dadosPorPasso" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cadastros_complementares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cadastros_complementares_agenciaId_key" ON "cadastros_complementares"("agenciaId");

-- AddForeignKey
ALTER TABLE "cadastros_complementares" ADD CONSTRAINT "cadastros_complementares_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
