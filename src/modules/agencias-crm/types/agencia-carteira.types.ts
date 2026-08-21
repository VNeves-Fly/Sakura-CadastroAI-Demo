// Listagem "Agências Sakura" (/crm/agencias) — SPEC_AGENCIAS_SAKURA.md,
// seção 3. Identidade/status/executivo vêm do roster comercial do SST
// (GET /api/agencias/ativas sem `codigoExecutivo`, ver
// agencia-carteira.sst-service.ts), não da tabela `Agencia` deste app
// (funil de cadastro/onboarding — conceito diferente, decisão do usuário
// 2026-08-21, mesmo critério já aplicado em executivo-agencias.types.ts).
// Gestor/base são melhor esforço via Promotor.sica → Promotor.gestorId/
// bases (única hierarquia Executivo→Gestor que existe, é local, não do
// SST). Canal de vendas, bilhetes, ticket médio, vendas mês/ano e última
// compra vêm do SST Service real quando a agência tem venda detectada;
// caem em mock determinístico via hash como fallback, documentado no
// adapter. Categoria/premiação e limite não têm fonte real hoje — seguem
// mock, razão documentada no adapter.
export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";
export type CanalVendas = "aereo" | "terrestre" | "ambos";

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
  base: string | null; // melhor esforço — primeira base do executivo, só quando há match local
  regiao: string | null; // real — derivada de Base.uf (ver regiao-por-uf.util.ts)
  categoria: CategoriaPremiacao | null; // mock — sem fonte real de faixa de premiação no SST
  canal: CanalVendas; // real (SST, resumo-agrupado aéreo+terrestre) — mock se sem venda detectada
  bilhetes: number; // real (SST) — mock se sem venda detectada
  ticketMedio: number; // real (SST) — mock se sem venda detectada
  vendasMes: number; // real (SST) — mock se sem venda detectada
  vendasAno: number; // real (SST) — mock se sem venda detectada
  diasSemComprar: number; // real (SST, data_ultima_venda) — mock se sem venda detectada
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
  ordenarPor: "vendasAno" | "vendasMes" | "razaoSocial" | "ultimaCompra" | "bilhetes" | "limite";
  ordenarDirecao: "asc" | "desc";
  ocultarInativadas: boolean;
}

// Configurável pelo usuário no rodapé da tabela (AgenciasPaginacao) —
// 20 por padrão pra abrir rápido mesmo com a carteira inteira em
// memória; as opções maiores existem pra quem prefere rolar menos.
export const TAMANHOS_PAGINA_AGENCIAS_PERMITIDOS = [20, 50, 100, 250] as const;
export const TAMANHO_PAGINA_AGENCIAS_PADRAO: number = TAMANHOS_PAGINA_AGENCIAS_PERMITIDOS[0];
