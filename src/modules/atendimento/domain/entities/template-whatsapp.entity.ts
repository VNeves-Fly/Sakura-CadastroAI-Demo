export type CategoriaTemplateEntity = "MARKETING" | "UTILITY" | "AUTHENTICATION";
export type StatusTemplateEntity = "aprovado" | "pendente_aprovacao" | "rejeitado";

export interface TemplateAprovadoEntity {
  id: string;
  nome: string;
  conteudo: string;
  categoria: CategoriaTemplateEntity;
  idioma: string;
  status: StatusTemplateEntity;
  motivoRejeicao: string | null;
  criadoEm: string;
}
