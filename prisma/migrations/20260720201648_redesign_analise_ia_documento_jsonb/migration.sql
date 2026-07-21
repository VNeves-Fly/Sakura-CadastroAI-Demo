/*
  Warnings:

  - You are about to drop the column `cnaeExtraido` on the `analises_ia_documentos` table. All the data in the column will be lost.
  - You are about to drop the column `dataCadastroExtraida` on the `analises_ia_documentos` table. All the data in the column will be lost.
  - You are about to drop the column `dataValidadeExtraida` on the `analises_ia_documentos` table. All the data in the column will be lost.
  - You are about to drop the column `numeroCadastur` on the `analises_ia_documentos` table. All the data in the column will be lost.
  - You are about to drop the column `razaoSocialExtraida` on the `analises_ia_documentos` table. All the data in the column will be lost.
  - You are about to drop the column `scoreConfianca` on the `analises_ia_documentos` table. All the data in the column will be lost.
  - You are about to drop the column `situacaoExtraida` on the `analises_ia_documentos` table. All the data in the column will be lost.
  - Added the required column `camposExtraidos` to the `analises_ia_documentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `camposExtras` to the `analises_ia_documentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confiancaExtracao` to the `analises_ia_documentos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "analises_ia_documentos" DROP COLUMN "cnaeExtraido",
DROP COLUMN "dataCadastroExtraida",
DROP COLUMN "dataValidadeExtraida",
DROP COLUMN "numeroCadastur",
DROP COLUMN "razaoSocialExtraida",
DROP COLUMN "scoreConfianca",
DROP COLUMN "situacaoExtraida",
ADD COLUMN     "alertas" TEXT[],
ADD COLUMN     "camposExtraidos" JSONB NOT NULL,
ADD COLUMN     "camposExtras" JSONB NOT NULL,
ADD COLUMN     "camposObrigatoriosPresentes" BOOLEAN,
ADD COLUMN     "confiancaExtracao" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "detalhesChecagem" JSONB,
ADD COLUMN     "formatoValido" BOOLEAN,
ADD COLUMN     "referenciaCruzadaOk" BOOLEAN,
ADD COLUMN     "resumoAnalise" TEXT,
ADD COLUMN     "textoBruto" TEXT;
