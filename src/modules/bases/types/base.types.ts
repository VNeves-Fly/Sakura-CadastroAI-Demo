export interface BaseView {
  id: string;
  sigla: string;
  nomeCidade: string;
  uf: string;
}

export interface BaseFormValues {
  sigla: string;
  nomeCidade: string;
  uf: string;
}

export interface BasePayload {
  sigla: string;
  nomeCidade: string;
  uf: string;
}
