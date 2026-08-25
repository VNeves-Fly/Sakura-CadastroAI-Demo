// Listagem "Agências Sakura" (/crm/agencias) — SPEC_AGENCIAS_SAKURA.md,
// seção 3. Identidade/status/executivo vêm do roster comercial do SST
// (GET /api/agencias/ativas sem `codigoExecutivo`, ver
// agencia-carteira.sst-service.ts), não da tabela `Agencia` deste app
// (funil de cadastro/onboarding — conceito diferente, decisão do usuário
// 2026-08-21, mesmo critério já aplicado em executivo-agencias.types.ts).
// `base` vem direto do SST (roster); gestor é melhor esforço via
// Promotor.sica → Promotor.gestorId (única hierarquia Executivo→Gestor
// que existe, é local, não do SST). Canal de vendas, bilhetes, ticket
// médio, vendas mês/ano e última compra vêm do SST Service real quando a
// agência tem venda detectada; ficam honestamente zerados/nulos (não
// mock) quando não há venda detectada em nenhum canal — pedido do
// usuário, 2026-08-25 (a listagem mostrava números inventados por hash,
// indistinguíveis de venda real). Categoria/premiação e limite não têm
// fonte real hoje — sempre null/0, nunca mock, razão documentada no
// adapter.
export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";
export type CanalVendas = "aereo" | "terrestre" | "ambos";
// SPEC_AGENCIAS_SAKURA (pixel, 2026-08-21) trocou as 3 abas antigas
// (Todas/Aprovadas/Reprovadas+Inativas) por só 2 — "Ativas" (mesmo grupo
// de "aprovadas": status === "ativo") e "Inativas" (mesmo grupo de
// "reprovadas_inativas": reprovadaOuInativa). A aba "Todas" agregada foi
// removida (pedido do usuário).
export type StatusTab = "ativas" | "inativas";

export interface AgenciaCarteiraView {
  id: string; // = String(codigoEmpresa) do SST
  razaoSocial: string;
  cnpj: string;
  status: string; // real (empresa_status do SST: "ativo"/"inativo")
  dadosFaltantes: boolean; // sem fonte real hoje (era ligado ao funil de onboarding) — sempre false
  reprovadaOuInativa: boolean; // real — status !== "ativo"
  executivoId: string | null; // real — Promotor.id resolvido via Promotor.sica === codigoExecutivo
  executivoNome: string | null; // real (SST, ou Promotor.nome quando há match local)
  gestorNome: string | null; // real — via Promotor.gestorId, só quando há match local
  base: string | null; // real — sigla do SST (roster), fallback pra Promotor.bases[0] local
  regiao: string | null; // real — derivada de Base.uf (ver regiao-por-uf.util.ts)
  categoria: CategoriaPremiacao | null; // sem fonte real de faixa de premiação no SST — sempre null
  canal: CanalVendas | null; // real (SST, resumo-agrupado aéreo+terrestre) — null se sem venda detectada
  bilhetes: number; // real (SST) — 0 se sem venda detectada
  ticketMedio: number; // real (SST) — 0 se sem venda detectada
  vendasMes: number; // real (SST) — 0 se sem venda detectada
  vendasAno: number; // real (SST) — 0 se sem venda detectada
  diasSemComprar: number | null; // real (SST, data_ultima_venda) — null se nenhuma venda detectada
  limite: number; // sem fonte real — SICA só espelha limite de crédito de fatura, não limite de compra; sempre 0
  sica: string | null; // real — mesmo código de codigoEmpresa, formatado como no SICA
}

// Configurável pelo usuário no rodapé da tabela (AgenciasPaginacao) —
// 20 por padrão pra abrir rápido mesmo com a carteira inteira em
// memória; as opções maiores existem pra quem prefere rolar menos.
export const TAMANHOS_PAGINA_AGENCIAS_PERMITIDOS = [20, 50, 100, 250] as const;
export const TAMANHO_PAGINA_AGENCIAS_PADRAO: number = TAMANHOS_PAGINA_AGENCIAS_PERMITIDOS[0];
