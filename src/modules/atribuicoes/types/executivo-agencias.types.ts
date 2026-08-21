// Aba "Agências" do detalhe do executivo (SPEC seção 6). Fonte: roster do
// SST (`/api/agencias/ativas?codigoExecutivo`, ver
// executivo-dashboard.sst-service.ts), não mais a tabela `Agencia` deste
// app (funil de cadastro/onboarding — conceito diferente, decisão do
// usuário 2026-08-20). Real: nome, cnpj, status, canal, faixaRecencia,
// vendas/bilhetes por período. `categoria` é uma faixa calculada a partir
// de `vendasAno` real (não mais hash aleatório). `limite` continua mock —
// "limite de crédito comercial" não existe no schema espelhado do SICA
// (ver docs/mock-exec-resp.md).
export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";
export type PeriodoVendas = "mes" | "30d" | "90d" | "ano";

export interface AgenciaCarteiraView {
  id: string; // = String(codigo) do SST
  nome: string;
  cnpj: string;
  status: string; // empresa_status do SST ("ativo"/"inativo")
  canal: "aereo" | "terrestre" | "ambos" | "nenhum";
  // Faixa aproximada, não dias exatos — o SST não expõe data exata da
  // última venda por agência num formato barato de buscar (ver
  // AgenciaCarteiraResumo em executivo-detalhe.types.ts).
  faixaRecencia: "ate30d" | "30a90d" | "90a365d" | "semVenda365d";
  categoria: CategoriaPremiacao;
  vendasAno: number;
  bilhetesAno: number;
  vendas90d: number;
  bilhetes90d: number;
  vendas30d: number;
  bilhetes30d: number;
  // Mock — "limite de crédito comercial" bloqueado (ver comentário acima).
  limite: number;
}

// Filtro "Premiação" removido daqui (2026-08-21, pedido do usuário) — a
// coluna "Categoria" continua na tabela (AgenciaCarteiraView.categoria),
// só não dá mais pra filtrar por ela.
export interface AgenciasCarteiraFiltros {
  busca: string;
  canalVendas: "todos" | "aereo" | "terrestre" | "ambos";
  ultimaCompra: "qualquer" | "ate30" | "30a90" | "mais90";
  ordenarPor: "vendasAno" | "vendasPeriodo" | "ticketMedio" | "ultimaCompra";
  periodo: PeriodoVendas;
  // "Apenas agências que estão comprando" — filtra pra só quem teve
  // venda (valorNoPeriodo(...).vendas > 0) no período selecionado acima
  // (pedido do usuário, 2026-08-19).
  apenasComprando: boolean;
}
