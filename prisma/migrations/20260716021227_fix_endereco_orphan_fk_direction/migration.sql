/*
  Warnings:

  - Inverte a direção do FK entre `Endereco` e seus três donos
    (`DadosReceita`, `CadastroComplementar`, `RepresentanteLegal`). Antes o
    FK ficava do lado do dono apontando pra `Endereco`, o que nunca permitia
    cascatear a exclusão do endereço quando o dono era apagado (um FK só
    cascateia do referenciado pra quem referencia, nunca ao contrário) —
    apagar um Cadastro deixava a linha em `enderecos` órfã pra sempre.
    Agora o FK fica em `enderecos`, apontando pro dono com
    `ON DELETE CASCADE`, então apagar o dono limpa o endereço junto.

*/
-- DropForeignKey
ALTER TABLE "cadastro_complementar" DROP CONSTRAINT "cadastro_complementar_enderecoAgenciaId_fkey";

-- DropForeignKey
ALTER TABLE "dados_receita" DROP CONSTRAINT "dados_receita_enderecoId_fkey";

-- DropForeignKey
ALTER TABLE "representantes_legais" DROP CONSTRAINT "representantes_legais_enderecoId_fkey";

-- DropIndex
DROP INDEX "cadastro_complementar_enderecoAgenciaId_key";

-- DropIndex
DROP INDEX "dados_receita_enderecoId_key";

-- DropIndex
DROP INDEX "representantes_legais_enderecoId_key";

-- AlterTable
ALTER TABLE "cadastro_complementar" DROP COLUMN "enderecoAgenciaId";

-- AlterTable
ALTER TABLE "dados_receita" DROP COLUMN "enderecoId";

-- AlterTable
ALTER TABLE "enderecos" ADD COLUMN     "cadastroComplementarId" TEXT,
ADD COLUMN     "dadosReceitaId" TEXT,
ADD COLUMN     "representanteLegalId" TEXT;

-- AlterTable
ALTER TABLE "representantes_legais" DROP COLUMN "enderecoId";

-- CreateIndex
CREATE UNIQUE INDEX "enderecos_dadosReceitaId_key" ON "enderecos"("dadosReceitaId");

-- CreateIndex
CREATE UNIQUE INDEX "enderecos_cadastroComplementarId_key" ON "enderecos"("cadastroComplementarId");

-- CreateIndex
CREATE UNIQUE INDEX "enderecos_representanteLegalId_key" ON "enderecos"("representanteLegalId");

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_dadosReceitaId_fkey" FOREIGN KEY ("dadosReceitaId") REFERENCES "dados_receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_cadastroComplementarId_fkey" FOREIGN KEY ("cadastroComplementarId") REFERENCES "cadastro_complementar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_representanteLegalId_fkey" FOREIGN KEY ("representanteLegalId") REFERENCES "representantes_legais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
