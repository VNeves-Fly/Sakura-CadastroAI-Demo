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
// SPEC_AGENCIAS_SAKURA (pixel, 2026-08-21) trocou as 3 abas antigas
// (Todas/Aprovadas/Reprovadas+Inativas) por só 2 — "Ativas" (mesmo grupo
// de "aprovadas": status === "ativo") e "Inativas" (mesmo grupo de
// "reprovadas_inativas": reprovadaOuInativa). A aba "Todas" agregada foi
// removida (pedido do usuário).
export type StatusTab = "ativas" | "inativas";

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
  sica: string | null; // real — Agencia.sicaCodigo
  margemPct: number; // mock — sem margem por agência modelada no domínio hoje
  margemLYPct: number; // mock
  margemVariacaoPct: number; // mock
}

export const TAMANHO_PAGINA_AGENCIAS = 250;
