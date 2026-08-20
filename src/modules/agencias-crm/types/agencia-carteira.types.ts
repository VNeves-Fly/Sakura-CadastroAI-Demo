// Listagem "Agências Sakura" (/crm/agencias) — SPEC_AGENCIAS_SAKURA.md,
// seção 3. Real: id, razaoSocial, cnpj, status, executivo/gestor (via
// ListarCadastrosUseCase, o mesmo motor real de /cadastros), base (melhor
// esforço — primeira base do executivo, mesma aproximação já usada em
// executivo-agencias.types.ts/gestor-agencias-tab.types.ts, já que Agencia
// não guarda a própria base). Dados faltantes deriva do status (mesma
// regra de gestor-agencias-tab.types.ts). O resto (categoria/premiação,
// canal de vendas, bilhetes, ticket médio, vendas mês/ano, última compra,
// limite, motivo de reprovação) não tem fonte real hoje — mock
// determinístico via hash, documentado no adapter.
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
  categoria: CategoriaPremiacao | null; // mock
  canal: CanalVendas; // mock
  bilhetes: number; // mock
  ticketMedio: number; // mock
  vendasMes: number; // mock
  vendasAno: number; // mock
  diasSemComprar: number; // mock
  limite: number; // mock
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
