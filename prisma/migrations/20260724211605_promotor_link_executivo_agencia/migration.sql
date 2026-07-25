-- AlterTable
ALTER TABLE "agencias" ADD COLUMN     "promotorLinkId" TEXT;

-- AlterTable
ALTER TABLE "promotores" ADD COLUMN     "linkExecutivoId" TEXT[];
