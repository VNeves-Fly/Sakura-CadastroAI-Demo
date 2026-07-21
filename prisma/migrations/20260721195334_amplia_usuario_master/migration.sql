-- AlterTable
ALTER TABLE "usuarios_master" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "origemRepresentanteLegalId" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "rgOrgaoEmissor" TEXT,
ADD COLUMN     "rgUf" TEXT,
ADD COLUMN     "salvoEm" TIMESTAMP(3),
ADD COLUMN     "salvoPor" TEXT,
ADD COLUMN     "telefone" TEXT;
