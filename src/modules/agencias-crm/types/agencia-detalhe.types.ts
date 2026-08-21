// Página de Detalhe da Agência (SPEC_AGENCIAS_SAKURA.md, seção 4). Campos
// marcados "real" abaixo vêm de Agencia/DadosReceita/RepresentanteLegal/
// CadastroComplementar/AnaliseIaAgencia (mesmas fontes do dossiê de
// /cadastros/:id, via cadastroAdminController.obterDetalhe +
// obterDadosReceita), ou do SST (bloco "vendas", ver
// agencia-detalhe.sst-service.ts) quando a agência tem sicaCodigo e a
// integração está ligada. "Limites & comercial" não tem fonte real hoje
// (não existe limite de crédito modelado no domínio) e segue mock
// determinístico, documentado no adapter.

export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";

export interface AgenciaDetalheEmpresa {
  nomeFantasia: string | null; // real
  razaoSocial: string; // real
  cnpj: string; // real
  statusLabel: string; // real
  statusClasses: string; // real
  etapaLabel: string | null; // real (derivado do status) — null quando a agência não tem cadastro/onboarding neste app (fonte 100% SST, ver adapter)
  situacaoReceita: string | null; // real (DadosReceita.situacaoCadastral) — null = "Não consultado"
  dataAbertura: string | null; // real
  tempoDeCnpj: string | null; // real (calculado)
  capitalSocial: number | null; // real
  naturezaJuridica: string | null; // real
  porte: string | null; // real
  optanteSimples: boolean | null; // real
  emailReceita: string | null; // real
  telefoneReceita: string | null; // real
  cnaePrincipal: { codigo: string; descricao: string } | null; // real
  cnaesSecundarios: { codigo: string; descricao: string }[]; // real
}

export interface AgenciaDetalheDatas {
  dataCadastroLegado: string | null; // real — Agencia.createdAt (única data real de cadastro que existe)
  tempoComoCliente: string; // real (calculado)
}

export interface AgenciaDetalheContato {
  nome: string | null; // real
  email: string; // real
  telefone1: string; // real
  telefone1Base: string | null; // melhor esforço — primeira base do executivo
  telefone2: string | null; // real (sempre null hoje — Agencia só guarda 1 telefone; mantido pra bater com o layout da SPEC)
  telefoneComercial: string | null; // real (CadastroComplementar)
  emailReceita: string | null; // real
  telefoneReceita: string | null; // real
}

export interface AgenciaDetalheEndereco {
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export interface AgenciaDetalheSocio {
  id: string; // real
  nome: string; // real
  cpf: string | null; // real
  rg: string | null; // real
  email: string | null; // real
  telefone: string | null; // real
  papel: string; // real (aproximação: "Administrador" se administrativo, senão "Sócio")
  participacaoPct: number | null; // sem fonte real — Prisma não guarda % de participação societária hoje; sempre `null`, UI mostra "—"
  temRg: boolean; // real
  temProcuracao: boolean; // real
}

export interface AgenciaDetalheDadosDocumentacao {
  empresa: AgenciaDetalheEmpresa;
  datas: AgenciaDetalheDatas;
  contato: AgenciaDetalheContato;
  endereco: AgenciaDetalheEndereco | null;
  socios: AgenciaDetalheSocio[];
}

export interface AgenciaDetalhePerfilComercial {
  sica: string | null; // real
  base: string | null; // melhor esforço
  gestorNome: string | null; // real
  executivoNome: string | null; // real
  segmento: string | null; // sem fonte real hoje — sempre `null`, UI mostra "—"
  mediaFaturamento: number | null; // sem fonte real hoje — sempre `null`, UI mostra "—"
  bancoNome: string | null; // real (CadastroComplementar, provavelmente null — roadmap não usado pela UI de cadastro hoje)
  bancoCodigo: string | null; // real
  bancoAgencia: string | null; // real
  bancoConta: string | null; // real
  limiteFaturado: number; // mock
  limiteCartao: number; // mock
  dataUltimaCompra: string | null; // real (SST) — mock se sicaCodigo ausente
  comissaoPct: number | null; // sem fonte real hoje — sempre `null`, UI mostra "—"
  incentivoPct: number | null; // sem fonte real hoje — sempre `null`, UI mostra "—"
  bloqCred: boolean; // mock
}

export interface TopCompanhiaAgencia {
  nome: string;
  volume: number;
}

export interface FaturaAgencia {
  numero: string;
  vencimento: string;
  cias: string;
  status: "pago" | "a_vencer" | "vencido";
  valor: number;
}

// Não consumidos por AgenciaDetalheVendas hoje (a aba "Vendas" antiga —
// sub-abas Reservas/Top Rotas — foi removida na reestilização de
// 2026-08-21), mas ainda produzidos por agencia-detalhe.sst-service.ts
// (VendasReaisSst.evolucaoMensal/topRotas/reservas) — mantidos pra não
// derrubar essa integração já validada contra o SST, caso a UI volte a
// precisar dessas séries.
export interface VendaMensalAgencia {
  mes: string;
  nacional: number;
  internacional: number;
  terrestre: number;
}

export interface TopRotaAgencia {
  rota: string;
  bilhetes: number;
  volume: number;
  // Real (SST) quando vendasReais existe, mas sempre `false` nesse caso —
  // /api/resumos/aereo não tem um flag nacional/internacional por trecho
  // e não há tabela de aeroportos pra derivar isso barato aqui. Mock por
  // hash (ver gerarTopRotas) continua variando o valor.
  internacional: boolean;
}

export interface ReservaAgencia {
  id: string;
  tipo: "aereo" | "terrestre";
  data: string;
  identificador: string;
  descricao: string;
  referencia: string | null;
  valor: number;
}

// vendas: real (SST, ver agencia-detalhe.sst-service.ts) quando a
// agência tem sicaCodigo e a integração está ligada — mock por hash
// como fallback (sem sicaCodigo, sem venda detectada, ou integração
// desligada). topCompanhias/faturas mostram só os itens mais recentes
// (mesma ordem de grandeza do mock anterior), não o histórico completo.
export interface AgenciaDetalheVendas {
  aereoNacional: { volume: number; bilhetes: number; pctAereo: number };
  aereoInternacional: { volume: number; bilhetes: number; pctAereo: number };
  terrestre: { volume: number; servicos: number; pctMix: number };
  volumeTotalAno: number;
  ticketMedioAereo: number;
  topCompanhias: TopCompanhiaAgencia[];
  faturas: FaturaAgencia[];
}

export interface AgenciaDetalheView {
  id: string;
  identificador: string; // mock — mesmo padrão de gerarIdentificador do módulo gestores
  categoria: CategoriaPremiacao | null; // mock
  temRiscoCadastral: boolean; // real — AnaliseIaAgencia.flagsRisco.length > 0
  ativoSistema: boolean; // real — status === "ativo"
  ativadoEm: string | null; // real — melhor data disponível de ativação (createdAt como aproximação)
  dadosDocumentacao: AgenciaDetalheDadosDocumentacao;
  perfilComercial: AgenciaDetalhePerfilComercial;
  vendas: AgenciaDetalheVendas;
}
