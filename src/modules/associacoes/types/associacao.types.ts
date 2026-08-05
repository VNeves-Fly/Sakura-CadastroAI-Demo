export interface AssociacaoView {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface AssociacaoFormValues {
  nome: string;
  ativo: boolean;
}

export interface AssociacaoPayload {
  nome: string;
  ativo: boolean;
}
