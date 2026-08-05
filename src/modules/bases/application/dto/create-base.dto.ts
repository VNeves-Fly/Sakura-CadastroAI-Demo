export interface CreateBaseInput {
  sigla: string;
  nomeCidade: string;
  uf: string;
}

export interface BaseOutput {
  id: string;
  sigla: string;
  nomeCidade: string;
  uf: string;
  createdAt: string;
}
