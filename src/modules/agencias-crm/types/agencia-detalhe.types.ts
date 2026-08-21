// Modal de Detalhe da Agência (SPEC_AGENCIAS_SAKURA.md, seção 4). Campos
// marcados "real" abaixo vêm de Agencia/DadosReceita/RepresentanteLegal/
// CadastroComplementar/AnaliseIaAgencia (mesmas fontes do dossiê de
// /cadastros/:id, via cadastroAdminController.obterDetalhe +
// obterDadosReceita). O bloco "vendas" inteiro, "limites & comercial" e o
// "risco de emissões" não têm fonte real hoje (não existe reserva/bilhete/
// fatura/limite de crédito modelado no domínio — ver exploração prévia) e
// são mock determinístico, documentado no adapter.

export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";

export interface AgenciaDetalheEmpresa {
  nomeFantasia: string | null; // real
  razaoSocial: string; // real
  cnpj: string; // real
  statusLabel: string; // real
  statusClasses: string; // real
  etapaLabel: string; // real (derivado do status)
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
  participacaoPct: number | null; // mock — Prisma não guarda % de participação societária hoje
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

export interface AgenciaDetalheAntecedencia {
  // mock — o SST tem data_emis/data_embarque por bilhete (/api/resumos/aereo),
  // então essa métrica é tecnicamente viável; não implementada nesta
  // integração (fora do escopo do plano original), fica como oportunidade.
  dias: number;
  bilhetes: number; // real (SST) quando vendasReais existe — mesmo total de vendas.aereoNacional/aereoInternacional.bilhetes
  mesesBase: number; // mock — nº de meses considerados (ano corrente até o mês atual)
}

// KPIs de topo do modal (SPEC 4.1, faixa de 4 cards acima das abas).
// diasSemComprar/dataUltimaCompra vêm do SST real (última reserva
// aérea/terrestre observada, ver agencia-detalhe.sst-service.ts) quando
// a agência tem sicaCodigo e a integração está ligada; caem no mesmo
// mock por hash da listagem (agencia-carteira.adapter.ts) como fallback.
// "Antecedência" (compra x embarque) continua mock — ver comentário no
// tipo acima.
export interface AgenciaDetalheKpisTopo {
  antecedenciaNacional: AgenciaDetalheAntecedencia;
  antecedenciaInternacional: AgenciaDetalheAntecedencia;
  diasSemComprar: number; // real (SST) — mock se sicaCodigo ausente
  dataUltimaCompra: string | null; // real (SST) — mock se sicaCodigo ausente
}

export interface AgenciaDetalhePerfilComercial {
  sica: string | null; // real
  base: string | null; // melhor esforço
  gestorNome: string | null; // real
  executivoNome: string | null; // real
  segmento: string | null; // mock — sem campo real de segmento comercial
  mediaFaturamento: number | null; // mock
  bancoNome: string | null; // real (CadastroComplementar, provavelmente null — roadmap não usado pela UI de cadastro hoje)
  bancoCodigo: string | null; // real
  bancoAgencia: string | null; // real
  bancoConta: string | null; // real
  limiteFaturado: number; // mock
  limiteCartao: number; // mock
  dataUltimaCompra: string | null; // real (SST) — mesmo valor de kpisTopo.dataUltimaCompra; mock se sicaCodigo ausente
  comissaoPct: number; // mock
  incentivoPct: number; // mock
  bloqCred: boolean; // mock
}

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

export interface TopCompanhiaAgencia {
  nome: string;
  volume: number;
}

export interface ResumoModalidade {
  modalidade: string;
  volume: number;
  pctMix: number;
  mediaMensal: number;
  itens: number;
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

export interface FaturaAgencia {
  numero: string;
  vencimento: string;
  cias: string;
  status: "pago" | "a_vencer" | "vencido";
  valor: number;
}

// vendas: real (SST, ver agencia-detalhe.sst-service.ts) quando a
// agência tem sicaCodigo e a integração está ligada — mock por hash
// como fallback (sem sicaCodigo, sem venda detectada, ou integração
// desligada), EXCETO riscoEmissao (score de risco de emissão não existe
// no SST hoje — sem endpoint equivalente, continua mock, e nenhum
// componente da UI consome esse campo hoje). mixAereoTerrestre e
// resumoComparativo são sempre cálculo local (real ou mock) sobre os
// volumes já resolvidos, nunca uma chamada própria ao SST. topRotas usa
// uma amostra de 90 dias (não o ano inteiro) — ver comentário no
// service. reservas/faturas mostram só os itens mais recentes (mesma
// ordem de grandeza do mock anterior), não o histórico completo.
export interface AgenciaDetalheVendas {
  riscoEmissao: {
    alto30d: number;
    alto90d: number;
    medio90d: number;
    valorEmRiscoAlto: number;
    scoreMedio90d: number;
    ultimaVendaRiscoAlto: string | null;
  };
  aereoNacional: { volume: number; bilhetes: number; pctAereo: number };
  aereoInternacional: { volume: number; bilhetes: number; pctAereo: number };
  terrestre: { volume: number; servicos: number; pctMix: number };
  volumeTotalAno: number;
  mediaVendasDia: { valor: number; bilhetesDia: number; dias: number };
  reservasAereo: { total: number; nacional: number; internacional: number };
  ticketMedioAereo: number;
  variacaoMesAnterior: { pct: number; valor: number };
  evolucaoMensal: VendaMensalAgencia[];
  topRotas: TopRotaAgencia[];
  topCompanhias: TopCompanhiaAgencia[];
  mixAereoTerrestre: { aereoPct: number; terrestrePct: number };
  resumoComparativo: ResumoModalidade[];
  reservas: ReservaAgencia[];
  faturas: FaturaAgencia[];
}

export interface AgenciaDetalheView {
  id: string;
  identificador: string; // mock — mesmo padrão de gerarIdentificador do módulo gestores
  categoria: CategoriaPremiacao | null; // mock
  temRiscoCadastral: boolean; // real — AnaliseIaAgencia.flagsRisco.length > 0
  ativoSistema: boolean; // real — status === "ativo"
  ativadoEm: string | null; // real — melhor data disponível de ativação (createdAt como aproximação)
  kpisTopo: AgenciaDetalheKpisTopo;
  dadosDocumentacao: AgenciaDetalheDadosDocumentacao;
  perfilComercial: AgenciaDetalhePerfilComercial;
  vendas: AgenciaDetalheVendas;
}
