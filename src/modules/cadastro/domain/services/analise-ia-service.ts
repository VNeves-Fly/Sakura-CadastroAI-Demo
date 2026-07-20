export interface AnaliseIaSocioInput {
  nome: string;
  cpf: string;
  rgPath: string;
  procuracaoPath: string | null;
}

export interface AnaliseIaInput {
  cnpj: string;
  razaoSocial: string;
  contratoSocialPath: string;
  socios: AnaliseIaSocioInput[];
}

export interface AnaliseIaResultado {
  aprovado: boolean;
  motivo: string | null;
  // Só preenchidos por uma implementação que devolve parecer estruturado
  // (ver FlysakuraAnaliseIaAdapter) — o mock não popula.
  parecer?: string;
  flagsRisco?: string[];
}

export interface AnaliseIaService {
  avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado>;
}
