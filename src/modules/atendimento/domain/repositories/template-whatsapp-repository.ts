import type { TemplateAprovadoEntity } from "@/modules/atendimento/domain/entities/template-whatsapp.entity";

export interface TemplateWhatsAppUpsertData {
  metaTemplateId: string;
  nome: string;
  idioma: string;
  conteudo: string;
  categoria?: string | null;
}

export interface TemplateWhatsAppRepository {
  findAllAprovados(): Promise<TemplateAprovadoEntity[]>;
  // Usado por SincronizarTemplatesWhatsAppUseCase pra fazer upsert do que
  // vem da Meta — chave de idempotência é o id do template lá (não muda
  // mesmo se o nome for reaproveitado por outro idioma).
  upsertPorMetaTemplateId(data: TemplateWhatsAppUpsertData): Promise<void>;
}
