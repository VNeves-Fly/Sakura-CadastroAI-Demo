// Hierarquia comercial: Agência (cliente final) atendida por um
// Executivo, que responde a um Gestor, que responde ao Diretor. Bases
// agrupam agências/cidades de uma região. Dados de origem: planilha real
// "MAPA COMERCIAL GESTORES" (aba MAPA_COMERCIAL_FINAL), na tabela
// CidadeComercial — ver domain/entities/cidade-comercial.entity.ts.

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
  // Contato real — vem da tabela Promotor (planilha "Links
  // Promotores.xlsx") quando essa view é montada por
  // paraExecutivosView; fica null quando é a agregação pura do mock de
  // cidades (agregarExecutivos, usada só por filtros/Remanejar).
  idSica: number | null;
  email: string | null;
  telefone: string | null;
}

export interface ResumoGestor {
  gestor: string;
  totalBases: number;
  totalExecutivos: number;
  totalCidades: number;
  // Soma do totalAgenciasMock dos executivos desse gestor — mesma
  // ressalva de dado ilustrativo do ResumoExecutivo.
  totalAgenciasMock: number;
  // Mesma ressalva do ResumoExecutivo — só vem preenchido quando essa
  // view é montada por paraGestoresView (tabela Promotor), e mesmo
  // assim só se o gestor também tiver sua própria linha de promotor.
  idSica: number | null;
  email: string | null;
  telefone: string | null;
}

export type TipoAtribuicao = "executivo" | "gestor" | "base";

export interface SubstituicaoHistorico {
  tipo: TipoAtribuicao;
  nomeAntigo: string;
  nomeNovo: string;
  totalCidadesAfetadas: number;
  data: string;
}

export interface FiltrosAtribuicoes {
  busca?: string;
  executivo?: string;
  gestor?: string;
  base?: string;
  regiao?: string;
  pagina?: number;
}
