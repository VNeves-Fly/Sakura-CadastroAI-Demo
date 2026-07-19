-- AlterTable
ALTER TABLE "signatarios_padrao" DROP COLUMN "ativo",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
