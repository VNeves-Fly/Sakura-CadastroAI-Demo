import type { TemplateAprovadoEntity } from "@/modules/atendimento/domain/entities/template-whatsapp.entity";

export interface TemplateWhatsAppUpsertData {
  metaTemplateId: string;
  nome: string;
  idioma: string;
  conteudo: string;
  categoria?: string | null;
  // Valor cru da Meta (APPROVED | PENDING | REJECTED | PAUSED) — o
  // repositório concreto que sabe converter pro enum local; mantém a
  // conversão Meta→enum num lugar só (junto da conversão enum→entidade
  // que já existe pras leituras).
  status: string;
  motivoRejeicao?: string | null;
}

export interface CriarTemplateLocalData {
  metaTemplateId: string;
  nome: string;
  idioma: string;
  conteudo: string;
  categoria: string;
}

// Metadata local (não muda nada na Meta) — título de exibição e
// liga/desliga do picker de envio, ambos editáveis a qualquer momento
// pelo analista.
export interface AtualizarTemplateMetadataData {
  titulo?: string | null;
  ativo?: boolean;
}

export interface TemplateWhatsAppRepository {
  findAllAprovados(): Promise<TemplateAprovadoEntity[]>;
  // Todos, independente do status — usado pela tela de gestão de
  // templates (Messenger), pro analista acompanhar pendente/rejeitado.
  findAll(): Promise<TemplateAprovadoEntity[]>;
  findById(id: string): Promise<TemplateAprovadoEntity | null>;
  // Id interno da Meta pro template (metaTemplateId) — não exposto na
  // entidade voltada pro front, só usado internamente pra chamar a Graph
  // API na hora de reenviar/editar.
  obterMetaTemplateId(id: string): Promise<string | null>;
  criarLocal(data: CriarTemplateLocalData): Promise<TemplateAprovadoEntity>;
  // Reenvio: novo conteúdo, volta pra pendente_aprovacao, some o motivo
  // antigo — Meta reavalia do zero.
  atualizarAposReenvio(id: string, novoConteudo: string): Promise<TemplateAprovadoEntity>;
  // Usado por SincronizarTemplatesWhatsAppUseCase pra fazer upsert do que
  // vem da Meta — chave de idempotência é o id do template lá (não muda
  // mesmo se o nome for reaproveitado por outro idioma).
  upsertPorMetaTemplateId(data: TemplateWhatsAppUpsertData): Promise<void>;
  // Título/ativo são só nossos — nunca sincronizados com a Meta, por isso
  // vivem numa atualização separada do reenvio (que edita conteúdo lá).
  atualizarMetadata(
    id: string,
    data: AtualizarTemplateMetadataData,
  ): Promise<TemplateAprovadoEntity>;
}
