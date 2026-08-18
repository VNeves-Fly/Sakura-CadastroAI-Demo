// Aba "Agências" do detalhe do executivo (SPEC seção 6). Real: id, nome
// (razaoSocial), cnpj, status (StatusAgencia real do Prisma). O resto
// (categoria de premiação, vendas, bilhetes, ticket médio, dias sem
// comprar, limite) não tem fonte hoje — mock determinístico, mesmo
// padrão das fases anteriores. Sem coluna BASE: AgenciaResumoPromotor não
// expõe base por agência (ver executivo-detalhe.types.ts).
export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";
export type PeriodoVendas = "mes" | "30d" | "90d" | "ano";

export interface AgenciaCarteiraView {
  id: string;
  nome: string;
  cnpj: string;
  status: string;
  // Real: deriva do status (em_analise/em_complementar = dados pendentes
  // no funil de cadastro).
  dadosFaltantes: boolean;
  // Real: deriva do status (recusado = inativada).
  inativada: boolean;
  categoria: CategoriaPremiacao;
  vendasAno: number;
  bilhetesAno: number;
  diasSemComprar: number;
  limite: number;
}

export interface AgenciasCarteiraFiltros {
  busca: string;
  dadosFaltantes: "todos" | "pendentes";
  // Sem fonte de dado real (nenhum canal de venda ligado a Agencia hoje)
  // — mantido como filtro visual configurável, mesmo tratamento de
  // outros filtros sem dado real confirmado.
  canalVendas: "todos" | "aereo" | "terrestre" | "ambos";
  premiacao: "todas" | CategoriaPremiacao;
  ultimaCompra: "qualquer" | "ate30" | "30a90" | "mais90";
  ordenarPor: "vendasAno" | "vendasPeriodo" | "ticketMedio" | "ultimaCompra";
  inativadasSakura: "ocultar" | "mostrar";
  periodo: PeriodoVendas;
}
