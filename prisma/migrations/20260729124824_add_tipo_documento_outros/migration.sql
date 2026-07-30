-- AlterEnum
ALTER TYPE "TipoDocumento" ADD VALUE 'OUTROS';

-- AlterTable
ALTER TABLE "documentos" ADD COLUMN     "descricaoOutro" TEXT;
