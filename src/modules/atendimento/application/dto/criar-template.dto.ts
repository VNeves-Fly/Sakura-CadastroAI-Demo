import type { CategoriaTemplateEntity } from "@/modules/atendimento/domain/entities/template-whatsapp.entity";

export interface CriarTemplateInput {
  nome: string;
  conteudo: string;
  categoria: CategoriaTemplateEntity;
  idioma: string;
}
