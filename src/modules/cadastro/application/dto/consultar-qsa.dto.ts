export interface ConsultarQsaInput {
  cnpj: string;
}

export interface ConsultarQsaOutput {
  cnpj: string;
  razaoSocial: string;
  cnaeCompativel: boolean;
  socios: Array<{ nome: string }>;
}
