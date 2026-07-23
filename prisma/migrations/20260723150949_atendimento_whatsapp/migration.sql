-- CreateEnum
CREATE TYPE "TipoContatoConversa" AS ENUM ('AGENCIA', 'NAO_IDENTIFICADO');

-- CreateEnum
CREATE TYPE "PapelMembroConversa" AS ENUM ('SOCIO', 'REPRESENTANTE_LEGAL', 'COMERCIAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoMensagemWhatsApp" AS ENUM ('TEXTO', 'AUDIO', 'IMAGEM', 'PDF');

-- CreateEnum
CREATE TYPE "AutorMensagem" AS ENUM ('CLIENTE', 'ANALISTA');

-- CreateEnum
CREATE TYPE "StatusEntregaMensagem" AS ENUM ('ENVIADO', 'ENTREGUE', 'LIDO', 'FALHOU');

-- CreateEnum
CREATE TYPE "StatusTemplateWhatsApp" AS ENUM ('APPROVED', 'PENDING', 'REJECTED', 'PAUSED');

-- CreateTable
CREATE TABLE "conversas" (
    "id" TEXT NOT NULL,
    "tipoContato" "TipoContatoConversa" NOT NULL DEFAULT 'AGENCIA',
    "agenciaId" TEXT,
    "telefoneWhatsapp" TEXT NOT NULL,
    "membroNome" TEXT,
    "membroPapel" "PapelMembroConversa" NOT NULL DEFAULT 'OUTRO',
    "membroTelefone" TEXT NOT NULL,
    "representanteLegalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "conversas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "autor" "AutorMensagem" NOT NULL,
    "analistaId" TEXT,
    "tipo" "TipoMensagemWhatsApp" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "duracaoSegundos" INTEGER,
    "tamanhoArquivoBytes" INTEGER,
    "midiaId" TEXT,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusEntregaMensagem" NOT NULL DEFAULT 'ENVIADO',
    "waMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_midia" (
    "id" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "gcsPath" TEXT NOT NULL,
    "gcsBucket" TEXT,
    "gcsSize" INTEGER,
    "gcsMd5" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_midia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assumir_atendimento_registros" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "analistaId" TEXT NOT NULL,
    "assumidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liberadoEm" TIMESTAMP(3),

    CONSTRAINT "assumir_atendimento_registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "textos_prontos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "textos_prontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates_whatsapp" (
    "id" TEXT NOT NULL,
    "metaTemplateId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "idioma" TEXT NOT NULL DEFAULT 'pt_BR',
    "categoria" TEXT,
    "status" "StatusTemplateWhatsApp" NOT NULL DEFAULT 'APPROVED',
    "conteudo" TEXT NOT NULL,
    "sincronizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversas_telefoneWhatsapp_key" ON "conversas"("telefoneWhatsapp");

-- CreateIndex
CREATE INDEX "conversas_agenciaId_idx" ON "conversas"("agenciaId");

-- CreateIndex
CREATE INDEX "conversas_tipoContato_idx" ON "conversas"("tipoContato");

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_midiaId_key" ON "mensagens"("midiaId");

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_waMessageId_key" ON "mensagens"("waMessageId");

-- CreateIndex
CREATE INDEX "mensagens_conversaId_idx" ON "mensagens"("conversaId");

-- CreateIndex
CREATE INDEX "mensagens_conversaId_createdAt_idx" ON "mensagens"("conversaId", "createdAt");

-- CreateIndex
CREATE INDEX "assumir_atendimento_registros_conversaId_idx" ON "assumir_atendimento_registros"("conversaId");

-- CreateIndex
CREATE UNIQUE INDEX "templates_whatsapp_metaTemplateId_key" ON "templates_whatsapp"("metaTemplateId");

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_representanteLegalId_fkey" FOREIGN KEY ("representanteLegalId") REFERENCES "representantes_legais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_midiaId_fkey" FOREIGN KEY ("midiaId") REFERENCES "mensagens_midia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assumir_atendimento_registros" ADD CONSTRAINT "assumir_atendimento_registros_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assumir_atendimento_registros" ADD CONSTRAINT "assumir_atendimento_registros_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "textos_prontos" ADD CONSTRAINT "textos_prontos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
