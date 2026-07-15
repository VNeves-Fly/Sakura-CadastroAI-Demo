export interface QsaSocio {
  nome: string;
}

export interface QsaResult {
  cnpj: string;
  razaoSocial: string;
  cnaeCompativel: boolean;
  socios: QsaSocio[];
}

export interface QsaConsultaService {
  consultar(cnpj: string): Promise<QsaResult | null>;
}
