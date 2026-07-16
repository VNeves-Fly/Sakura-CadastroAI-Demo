/*
  Warnings:

  - You are about to drop the `agencias` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EtapaCadastro" AS ENUM ('FICHA', 'COMPLEMENTAR', 'DOCUMENTOS', 'CONTRATO', 'CREDENCIAIS', 'RECUSADO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CONTRATO_SOCIAL', 'CADASTUR', 'RG_CNPJ', 'COMPROVANTE_ENDERECO', 'COMPROVANTE_ENDERECO_AGENCIA', 'CERTIDAO_CASAMENTO', 'PROCURACAO');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('RASCUNHO', 'ENVIADO', 'PROCESSANDO', 'VISUALIZADO', 'ASSINADO_AGENCIA', 'ASSINADO', 'REJEITADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EtapaDecisao" AS ENUM ('ANALISE', 'COMPLEMENTAR');

-- CreateEnum
CREATE TYPE "ResultadoDecisao" AS ENUM ('APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "PapelRepresentante" AS ENUM ('SOCIO', 'PROCURADOR');

-- CreateEnum
CREATE TYPE "TipoVenda" AS ENUM ('NACIONAL', 'INTERNACIONAL', 'TERRESTRE');

-- DropTable
DROP TABLE "agencias";

-- CreateTable
CREATE TABLE "cadastros" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "origem" TEXT,
    "analiseIaAt" TIMESTAMP(3),
    "etapaAtual" "EtapaCadastro" NOT NULL DEFAULT 'FICHA',
    "status" TEXT,
    "dataSolicitacao" TIMESTAMP(3),
    "uploadToken" TEXT,
    "sicaCodigo" TEXT,
    "travelLinkCriado" BOOLEAN NOT NULL DEFAULT false,
    "travelLinkCriadoEm" TIMESTAMP(3),
    "travelLinkCriadoPor" TEXT,
    "baseId" TEXT,
    "gestorResponsavel" TEXT,
    "executivoId" TEXT,
    "promotorResponsavel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cadastros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dados_receita" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "situacaoCadastral" TEXT NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL,
    "naturezaJuridica" TEXT NOT NULL,
    "porte" TEXT,
    "capitalSocial" DECIMAL(14,2),
    "telefone" TEXT,
    "email" TEXT,
    "optanteSimples" BOOLEAN NOT NULL DEFAULT false,
    "dataOpcaoSimples" TIMESTAMP(3),
    "enderecoId" TEXT,
    "consultadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dados_receita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cnaes" (
    "id" TEXT NOT NULL,
    "dadosReceitaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cnaes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_validacoes" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "etapaAlvo" "EtapaCadastro" NOT NULL,
    "liberado" BOOLEAN NOT NULL,
    "motivoBloqueio" TEXT,
    "avaliadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_validacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_master" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadastro_complementar" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "siteEmpresa" TEXT,
    "telefoneComercial" TEXT,
    "emailOperacional" TEXT,
    "emailComercial" TEXT,
    "emailFinanceiro" TEXT,
    "cadasturNumero" TEXT,
    "cadasturDataCadastro" TIMESTAMP(3),
    "cadasturValidade" TIMESTAMP(3),
    "cadasturSituacao" TEXT,
    "resideBrasil" BOOLEAN,
    "tipoAgencia" TEXT,
    "enderecoAgenciaId" TEXT,
    "enderecoAgenciaMesmoTitular" BOOLEAN,
    "socioVinculadoEnderecoId" TEXT,
    "bancoNo" TEXT,
    "agenciaNo" TEXT,
    "contaNo" TEXT,
    "tipoConta" TEXT,
    "favorecidoNome" TEXT,
    "favorecidoDoc" TEXT,
    "chavePix" TEXT,
    "tipoChavePix" TEXT,
    "tipoFaturamento" TEXT,
    "percCorporativo" DECIMAL(5,2),
    "percConvencional" DECIMAL(5,2),
    "submetidoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cadastro_complementar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venda_percentuais" (
    "id" TEXT NOT NULL,
    "cadastroComplementarId" TEXT NOT NULL,
    "tipo" "TipoVenda" NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "venda_percentuais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "representantes_legais" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "cnpj" TEXT,
    "isPj" BOOLEAN NOT NULL DEFAULT false,
    "rg" TEXT,
    "rgOrgaoEmissor" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "estadoCivil" TEXT,
    "regimeBens" TEXT,
    "nacionalidade" TEXT,
    "cargo" TEXT,
    "papel" "PapelRepresentante" NOT NULL DEFAULT 'SOCIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "origem" TEXT,
    "preenchidoPorIa" BOOLEAN NOT NULL DEFAULT false,
    "enderecoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "representantes_legais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conjuges" (
    "id" TEXT NOT NULL,
    "representanteLegalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "nacionalidade" TEXT,

    CONSTRAINT "conjuges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "representanteLegalId" TEXT,
    "tipo" "TipoDocumento" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "gcsPath" TEXT NOT NULL,
    "gcsBucket" TEXT NOT NULL,
    "gcsSize" INTEGER,
    "gcsMd5" TEXT,
    "status" "StatusDocumento" NOT NULL DEFAULT 'PENDENTE',
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "reprovadoPor" TEXT,
    "motivoReprovacao" TEXT,
    "reprovadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_ia_documentos" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "numeroCadastur" TEXT,
    "razaoSocialExtraida" TEXT,
    "dataCadastroExtraida" TIMESTAMP(3),
    "dataValidadeExtraida" TIMESTAMP(3),
    "situacaoExtraida" TEXT,
    "cnaeExtraido" TEXT,
    "scoreConfianca" DECIMAL(5,2),
    "processadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_ia_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'RASCUNHO',
    "numContrato" TEXT,
    "conteudoPreenchido" TEXT,
    "geradoEm" TIMESTAMP(3),
    "geradoPor" TEXT,
    "leituraConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "leituraConfirmadaPor" TEXT,
    "leituraConfirmadaEm" TIMESTAMP(3),
    "d4signDocumentId" TEXT,
    "contratoGcsPath" TEXT,
    "pdfAssinadoGcsPath" TEXT,
    "assinadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato_signatarios" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "representanteLegalId" TEXT,
    "signatarioPadraoId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "cpf" TEXT,
    "rg" TEXT,
    "rgOrgaoEmissor" TEXT,
    "cargo" TEXT,
    "nacionalidade" TEXT,
    "estadoCivil" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "cepSnapshot" TEXT,
    "logradouroSnapshot" TEXT,
    "numeroSnapshot" TEXT,
    "complementoSnapshot" TEXT,
    "bairroSnapshot" TEXT,
    "cidadeSnapshot" TEXT,
    "ufSnapshot" TEXT,

    CONSTRAINT "contrato_signatarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato_campos_pendentes" (
    "id" TEXT NOT NULL,
    "contratoSignatarioId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,

    CONSTRAINT "contrato_campos_pendentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avancos_forcados" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "etapaAlvo" "EtapaCadastro" NOT NULL,
    "motivo" TEXT NOT NULL,
    "gateMotivoBloqueio" TEXT,
    "statusReal" TEXT,
    "solicitadoPor" TEXT,
    "autorizadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avancos_forcados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avanco_forcado_pendencias" (
    "id" TEXT NOT NULL,
    "avancoForcadoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "avanco_forcado_pendencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_historico" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "etapaAnterior" "EtapaCadastro",
    "etapaNova" "EtapaCadastro" NOT NULL,
    "usuarioEmail" TEXT,
    "origem" TEXT,
    "observacao" TEXT,
    "desbloqueioManual" BOOLEAN,
    "detalhes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisoes_humanas" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "etapa" "EtapaDecisao" NOT NULL,
    "decisaoIa" TEXT,
    "decisaoHumana" "ResultadoDecisao" NOT NULL,
    "justificativa" TEXT NOT NULL,
    "usuarioEmail" TEXT NOT NULL,
    "modeloIa" TEXT,
    "scoreIa" DOUBLE PRECISION,
    "divergiu" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisoes_humanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatarios_padrao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "signatarios_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cadastros_cnpj_key" ON "cadastros"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "cadastros_uploadToken_key" ON "cadastros"("uploadToken");

-- CreateIndex
CREATE UNIQUE INDEX "dados_receita_cadastroId_key" ON "dados_receita"("cadastroId");

-- CreateIndex
CREATE UNIQUE INDEX "dados_receita_enderecoId_key" ON "dados_receita"("enderecoId");

-- CreateIndex
CREATE INDEX "cnaes_dadosReceitaId_idx" ON "cnaes"("dadosReceitaId");

-- CreateIndex
CREATE INDEX "gate_validacoes_cadastroId_idx" ON "gate_validacoes"("cadastroId");

-- CreateIndex
CREATE INDEX "alertas_cadastroId_idx" ON "alertas"("cadastroId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_master_cadastroId_key" ON "usuarios_master"("cadastroId");

-- CreateIndex
CREATE UNIQUE INDEX "cadastro_complementar_cadastroId_key" ON "cadastro_complementar"("cadastroId");

-- CreateIndex
CREATE UNIQUE INDEX "cadastro_complementar_enderecoAgenciaId_key" ON "cadastro_complementar"("enderecoAgenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "venda_percentuais_cadastroComplementarId_tipo_key" ON "venda_percentuais"("cadastroComplementarId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "representantes_legais_enderecoId_key" ON "representantes_legais"("enderecoId");

-- CreateIndex
CREATE INDEX "representantes_legais_cadastroId_idx" ON "representantes_legais"("cadastroId");

-- CreateIndex
CREATE UNIQUE INDEX "conjuges_representanteLegalId_key" ON "conjuges"("representanteLegalId");

-- CreateIndex
CREATE INDEX "documentos_cadastroId_idx" ON "documentos"("cadastroId");

-- CreateIndex
CREATE UNIQUE INDEX "analises_ia_documentos_documentoId_key" ON "analises_ia_documentos"("documentoId");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numContrato_key" ON "contratos"("numContrato");

-- CreateIndex
CREATE INDEX "contratos_cadastroId_idx" ON "contratos"("cadastroId");

-- CreateIndex
CREATE INDEX "contrato_signatarios_contratoId_idx" ON "contrato_signatarios"("contratoId");

-- CreateIndex
CREATE INDEX "avancos_forcados_cadastroId_idx" ON "avancos_forcados"("cadastroId");

-- CreateIndex
CREATE INDEX "kanban_historico_cadastroId_idx" ON "kanban_historico"("cadastroId");

-- CreateIndex
CREATE INDEX "decisoes_humanas_cadastroId_idx" ON "decisoes_humanas"("cadastroId");

-- CreateIndex
CREATE INDEX "notificacoes_cadastroId_idx" ON "notificacoes"("cadastroId");

-- AddForeignKey
ALTER TABLE "dados_receita" ADD CONSTRAINT "dados_receita_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dados_receita" ADD CONSTRAINT "dados_receita_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnaes" ADD CONSTRAINT "cnaes_dadosReceitaId_fkey" FOREIGN KEY ("dadosReceitaId") REFERENCES "dados_receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_validacoes" ADD CONSTRAINT "gate_validacoes_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_master" ADD CONSTRAINT "usuarios_master_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadastro_complementar" ADD CONSTRAINT "cadastro_complementar_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadastro_complementar" ADD CONSTRAINT "cadastro_complementar_enderecoAgenciaId_fkey" FOREIGN KEY ("enderecoAgenciaId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadastro_complementar" ADD CONSTRAINT "cadastro_complementar_socioVinculadoEnderecoId_fkey" FOREIGN KEY ("socioVinculadoEnderecoId") REFERENCES "representantes_legais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venda_percentuais" ADD CONSTRAINT "venda_percentuais_cadastroComplementarId_fkey" FOREIGN KEY ("cadastroComplementarId") REFERENCES "cadastro_complementar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "representantes_legais" ADD CONSTRAINT "representantes_legais_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "representantes_legais" ADD CONSTRAINT "representantes_legais_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjuges" ADD CONSTRAINT "conjuges_representanteLegalId_fkey" FOREIGN KEY ("representanteLegalId") REFERENCES "representantes_legais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_representanteLegalId_fkey" FOREIGN KEY ("representanteLegalId") REFERENCES "representantes_legais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_ia_documentos" ADD CONSTRAINT "analises_ia_documentos_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_signatarios" ADD CONSTRAINT "contrato_signatarios_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_signatarios" ADD CONSTRAINT "contrato_signatarios_representanteLegalId_fkey" FOREIGN KEY ("representanteLegalId") REFERENCES "representantes_legais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_signatarios" ADD CONSTRAINT "contrato_signatarios_signatarioPadraoId_fkey" FOREIGN KEY ("signatarioPadraoId") REFERENCES "signatarios_padrao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_campos_pendentes" ADD CONSTRAINT "contrato_campos_pendentes_contratoSignatarioId_fkey" FOREIGN KEY ("contratoSignatarioId") REFERENCES "contrato_signatarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avancos_forcados" ADD CONSTRAINT "avancos_forcados_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avanco_forcado_pendencias" ADD CONSTRAINT "avanco_forcado_pendencias_avancoForcadoId_fkey" FOREIGN KEY ("avancoForcadoId") REFERENCES "avancos_forcados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_historico" ADD CONSTRAINT "kanban_historico_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisoes_humanas" ADD CONSTRAINT "decisoes_humanas_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
