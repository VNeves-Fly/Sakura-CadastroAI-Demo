export type CategoriaTemplateEntity = "MARKETING" | "UTILITY" | "AUTHENTICATION";
export type StatusTemplateEntity = "aprovado" | "pendente_aprovacao" | "rejeitado";

export interface TemplateAprovadoEntity {
  id: string;
  nome: string;
  // Nome amigável definido localmente pro analista — nunca mandado pra
  // Meta, só de exibição. Cai pro `nome` técnico quando não definido.
  titulo: string | null;
  conteudo: string;
  categoria: CategoriaTemplateEntity;
  idioma: string;
  status: StatusTemplateEntity;
  // Liga/desliga o template só do nosso lado — some do picker de envio
  // mesmo que continue aprovado na Meta.
  ativo: boolean;
  motivoRejeicao: string | null;
  criadoEm: string;
}
