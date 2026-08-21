// Listagem "Agências Sakura" (/crm/agencias) — SPEC_AGENCIAS_SAKURA.md,
// seção 3. Real: id, razaoSocial, cnpj, status, executivo/gestor (via
// ListarCadastrosUseCase, o mesmo motor real de /cadastros), base (melhor
// esforço — primeira base do executivo, mesma aproximação já usada em
// executivo-agencias.types.ts/gestor-agencias-tab.types.ts, já que Agencia
// não guarda a própria base). Dados faltantes deriva do status (mesma
// regra de gestor-agencias-tab.types.ts). Canal de vendas, bilhetes,
// ticket médio, vendas mês/ano e última compra vêm do SST Service real
// (ver agencia-carteira.sst-service.ts) quando a agência tem sicaCodigo
// e a integração está ligada (SST_API_KEY configurada); caem em
// mock determinístico via hash como fallback, documentado no adapter.
// Categoria/premiação, limite e motivo de reprovação não têm fonte real
// hoje — seguem mock, razão documentada no adapter.
export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";
export type CanalVendas = "aereo" | "terrestre" | "ambos";
export type StatusTab = "todas" | "aprovadas" | "reprovadas_inativas";

export interface AgenciaCarteiraView {
  id: string;
  razaoSocial: string;
  cnpj: string;
  status: string; // real (StatusAgencia)
  dadosFaltantes: boolean; // real — deriva do status
  reprovadaOuInativa: boolean; // real — status === "recusado"
  executivoId: string | null; // real
  executivoNome: string | null; // real
  gestorNome: string | null; // real
  base: string | null; // melhor esforço — primeira base do executivo
  regiao: string | null; // real — derivada de Base.uf (ver regiao-por-uf.util.ts)
  createdAt: string; // real (ISO)
  motivo: string | null; // mock — sem fonte real de motivo de reprovação na listagem hoje (ver adapter)
  categoria: CategoriaPremiacao | null; // mock — sem fonte real de faixa de premiação no SST
  canal: CanalVendas; // real (SST, resumo-agrupado aéreo+terrestre) — mock se sicaCodigo ausente
  bilhetes: number; // real (SST) — mock se sicaCodigo ausente
  ticketMedio: number; // real (SST) — mock se sicaCodigo ausente
  vendasMes: number; // real (SST) — mock se sicaCodigo ausente
  vendasAno: number; // real (SST) — mock se sicaCodigo ausente
  diasSemComprar: number; // real (SST, data_ultima_venda) — mock se sicaCodigo ausente
  limite: number; // mock — SICA só espelha limite de crédito de fatura, não limite de compra
}

export interface OpcaoFiltro {
  value: string;
  label: string;
}

export interface AgenciasCarteiraFiltros {
  busca: string;
  regiao: "todas" | string;
  base: "todas" | string;
  executivoId: "todos" | string;
  gestorNome: "todos" | string;
  // Sem fonte real na listagem hoje (DadosReceita não é resolvido em lote
  // por ListarCadastrosUseCase, só no detalhe de uma agência) — mesmo
  // tratamento do toggle GCP em promotor-lista.types.ts: fica visível
  // (SPEC pede) mas não filtra nada ainda.
  situacaoReceita: "todas" | string;
  dadosFaltantes: "todos" | "pendentes";
  canalVendas: "todos" | CanalVendas;
  premiacao: "todas" | CategoriaPremiacao;
  ultimaCompra: "qualquer" | "ate30" | "30a90" | "mais90";
  ordenarPor:
    | "vendasAno"
    | "vendasMes"
    | "razaoSocial"
    | "createdAt"
    | "ultimaCompra"
    | "bilhetes"
    | "limite";
  ordenarDirecao: "asc" | "desc";
  ocultarInativadas: boolean;
}

export const TAMANHO_PAGINA_AGENCIAS = 250;
