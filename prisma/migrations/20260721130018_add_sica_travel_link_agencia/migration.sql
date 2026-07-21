-- AlterTable
ALTER TABLE "agencias" ADD COLUMN     "sicaCodigo" TEXT,
ADD COLUMN     "sicaSalvoEm" TIMESTAMP(3),
ADD COLUMN     "sicaSalvoPor" TEXT,
ADD COLUMN     "travelLinkCriado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "travelLinkSalvoEm" TIMESTAMP(3),
ADD COLUMN     "travelLinkSalvoPor" TEXT;
