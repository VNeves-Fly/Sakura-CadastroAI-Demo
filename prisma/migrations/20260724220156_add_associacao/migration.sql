-- AlterTable
ALTER TABLE "agencias" ADD COLUMN     "associacaoId" TEXT;

-- CreateTable
CREATE TABLE "associacoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "associacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "agencias" ADD CONSTRAINT "agencias_associacaoId_fkey" FOREIGN KEY ("associacaoId") REFERENCES "associacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
