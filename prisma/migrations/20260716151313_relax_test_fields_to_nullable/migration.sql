-- AlterTable
ALTER TABLE "alertas" ALTER COLUMN "tipo" DROP NOT NULL,
ALTER COLUMN "mensagem" DROP NOT NULL;

-- AlterTable
ALTER TABLE "avanco_forcado_pendencias" ALTER COLUMN "descricao" DROP NOT NULL;

-- AlterTable
ALTER TABLE "avancos_forcados" ALTER COLUMN "etapaAlvo" DROP NOT NULL,
ALTER COLUMN "motivo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "cadastros" ALTER COLUMN "cnpj" DROP NOT NULL,
ALTER COLUMN "razaoSocial" DROP NOT NULL;

-- AlterTable
ALTER TABLE "cnaes" ALTER COLUMN "codigo" DROP NOT NULL,
ALTER COLUMN "descricao" DROP NOT NULL;

-- AlterTable
ALTER TABLE "conjuges" ALTER COLUMN "nome" DROP NOT NULL;

-- AlterTable
ALTER TABLE "contrato_campos_pendentes" ALTER COLUMN "campo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "contrato_signatarios" ALTER COLUMN "nome" DROP NOT NULL;

-- AlterTable
ALTER TABLE "dados_receita" ALTER COLUMN "situacaoCadastral" DROP NOT NULL,
ALTER COLUMN "dataAbertura" DROP NOT NULL,
ALTER COLUMN "naturezaJuridica" DROP NOT NULL;

-- AlterTable
ALTER TABLE "decisoes_humanas" ALTER COLUMN "etapa" DROP NOT NULL,
ALTER COLUMN "decisaoHumana" DROP NOT NULL,
ALTER COLUMN "justificativa" DROP NOT NULL,
ALTER COLUMN "usuarioEmail" DROP NOT NULL;

-- AlterTable
ALTER TABLE "documentos" ALTER COLUMN "tipo" DROP NOT NULL,
ALTER COLUMN "fileName" DROP NOT NULL,
ALTER COLUMN "mimeType" DROP NOT NULL,
ALTER COLUMN "gcsPath" DROP NOT NULL,
ALTER COLUMN "gcsBucket" DROP NOT NULL;

-- AlterTable
ALTER TABLE "enderecos" ALTER COLUMN "cep" DROP NOT NULL,
ALTER COLUMN "logradouro" DROP NOT NULL,
ALTER COLUMN "numero" DROP NOT NULL,
ALTER COLUMN "bairro" DROP NOT NULL,
ALTER COLUMN "cidade" DROP NOT NULL,
ALTER COLUMN "uf" DROP NOT NULL;

-- AlterTable
ALTER TABLE "gate_validacoes" ALTER COLUMN "etapaAlvo" DROP NOT NULL,
ALTER COLUMN "liberado" DROP NOT NULL;

-- AlterTable
ALTER TABLE "kanban_historico" ALTER COLUMN "etapaNova" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notificacoes" ALTER COLUMN "tipo" DROP NOT NULL,
ALTER COLUMN "titulo" DROP NOT NULL,
ALTER COLUMN "mensagem" DROP NOT NULL;

-- AlterTable
ALTER TABLE "representantes_legais" ALTER COLUMN "nome" DROP NOT NULL;

-- AlterTable
ALTER TABLE "signatarios_padrao" ALTER COLUMN "nome" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "ordem" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuarios_master" ALTER COLUMN "nome" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "venda_percentuais" ALTER COLUMN "tipo" DROP NOT NULL,
ALTER COLUMN "percentual" DROP NOT NULL;

