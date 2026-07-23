// Hierarquia comercial: Agência (cliente final) atendida por um
// Executivo, que responde a um Gestor, que responde ao Diretor. Bases
// agrupam agências/cidades de uma região. Dados de origem: planilha real
// "MAPA COMERCIAL GESTORES" (aba MAPA_COMERCIAL_FINAL) — usada como mock
// por enquanto (decisão do usuário, 2026-07-23), sem tabela própria no
// banco ainda.

export interface Cidade {
  regiao: string | null;
  estado: string | null;
  cidade: string;
  ddd: string | null;
  base: string | null;
  executivo: string | null;
  gestor: string | null;
  subregiaoSp: string | null;
}

export interface ResumoRegiao {
  regiao: string;
  totalCidades: number;
  totalBases: number;
  totalExecutivos: number;
}

export interface ResumoBase {
  base: string;
  gestor: string | null;
  totalExecutivos: number;
  totalCidades: number;
  regioes: string[];
}

export interface ResumoExecutivo {
  executivo: string;
  base: string | null;
  totalBases: number;
  gestor: string | null;
  totalCidades: number;
  // Ilustrativo — não existe ainda vínculo real Agencia -> Executivo no
  // banco (ver resolver-origem.util.ts do módulo eventos pro mesmo tipo
  // de limitação). Gerado de forma determinística a partir do nome só
  // pra dar um número plausível de exemplo na tela.
  totalAgenciasMock: number;
}

export interface ResumoGestor {
  gestor: string;
  totalBases: number;
  totalExecutivos: number;
  totalCidades: number;
  // Soma do totalAgenciasMock dos executivos desse gestor — mesma
  // ressalva de dado ilustrativo do ResumoExecutivo.
  totalAgenciasMock: number;
}

export interface FiltrosAtribuicoes {
  busca?: string;
  executivo?: string;
  gestor?: string;
  base?: string;
  regiao?: string;
  pagina?: number;
}
