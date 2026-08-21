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
  dataUltimaCompra: string | null; // mock
  comissaoPct: number; // mock
  incentivoPct: number; // mock
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
