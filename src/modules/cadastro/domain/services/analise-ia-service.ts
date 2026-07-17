export interface AnaliseIaInput {
  cnpj: string;
}

export interface AnaliseIaResultado {
  aprovado: boolean;
  motivo: string | null;
}

export interface AnaliseIaService {
  avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado>;
}
