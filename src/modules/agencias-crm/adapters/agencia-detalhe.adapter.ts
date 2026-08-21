import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { labelStatus, classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import { tempoDecorrido } from "@/modules/agencias-crm/utils/tempo-decorrido.util";
import type { AgenciaDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DadosReceita } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  AgenciaDetalheView,
  CategoriaPremiacao,
  FaturaAgencia,
  TopCompanhiaAgencia,
} from "@/modules/agencias-crm/types/agencia-detalhe.types";

const CATEGORIAS: CategoriaPremiacao[] = ["10K", "100K", "1M", "10M"];
const COMPANHIAS_AEREAS = [
  "Azul",
  "Gol",
  "Latam",
  "Boliviana de Aviacion",
  "Iberia",
  "Lufthansa",
  "Air France",
  "Air Europa",
  "Tap Portugal",
  "United Airlines",
];

// "123 Viagens..." -> "AG-123" — mesmo padrão de identificador único mock
// já usado no módulo gestores (ver gerarIdentificador em
// gestor-detalhe.adapter.ts), sem campo real equivalente no model Agencia.
function gerarIdentificador(razaoSocial: string): string {
  const primeiraPalavra =
    razaoSocial
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .split(/\s+/)
      .filter(Boolean)[0] ?? "AGENCIA";
  return `AG-${primeiraPalavra.toUpperCase().slice(0, 12)}`;
}

// "Etapa" do cabeçalho (SPEC 4.4, badge cinza "contrato"/"aprovado"/
// "inativo") — sem campo real equivalente a isso no schema
// (Agencia.etapaAtual é um contador de passo do wizard público, não essa
// taxonomia); derivado do status real por aproximação.
function labelEtapa(status: string): string {
  if (status === "ativo") return "aprovado";
  if (status === "recusado") return "inativo";
  if (status === "em_analise" || status === "em_complementar") return "análise";
  return "contrato";
}

function gerarTopCompanhias(base: number): TopCompanhiaAgencia[] {
  return COMPANHIAS_AEREAS.map((nome, indice) => ({
    nome,
    volume: 10_000 + (hashParaNumero(`${base}-${nome}`) % ((10 - indice) * 40_000 + 5_000)),
  })).sort((a, b) => b.volume - a.volume);
}

function gerarFaturas(base: number, quantidade: number): FaturaAgencia[] {
  return Array.from({ length: quantidade }, (_, indice) => {
    const seed = base + indice * 61;
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + (seed % 60) - 30);
    const status: FaturaAgencia["status"] =
      seed % 10 === 0 ? "vencido" : seed % 3 === 0 ? "a_vencer" : "pago";
    const credito = seed % 15 === 0;
    return {
      numero: `#${String(100000 + (seed % 900000))}`,
      vencimento: hoje.toISOString(),
      cias: COMPANHIAS_AEREAS[seed % COMPANHIAS_AEREAS.length]!,
      status,
      valor: credito ? -(500 + (seed % 3_000)) : 500 + (seed % 8_000),
    };
  });
}

export interface ExecutivoContexto {
  base: string | null;
  gestorNome: string | null;
}

export function montarAgenciaDetalheView(
  detalhe: AgenciaDetalhe,
  dadosReceita: DadosReceita | null,
  executivoContexto: ExecutivoContexto,
): AgenciaDetalheView {
  const agencia = detalhe.agencia;
  const base = hashParaNumero(agencia.id);
  const semVenda = base % 12 === 0;
  const categoria = semVenda ? null : CATEGORIAS[base % CATEGORIAS.length]!;

  const volumeAno = semVenda ? 0 : ((base % 900) + 30) * 15_000;
  const bilhetesAno = semVenda ? 0 : 30 + (base % 600);
  const volumeNacional = Math.round(volumeAno * 0.55);
  const volumeInternacional = Math.round(volumeAno * 0.4);
  const volumeTerrestre = volumeAno - volumeNacional - volumeInternacional;
  const bilhetesNacional = Math.round(bilhetesAno * 0.72);
  const bilhetesInternacional = bilhetesAno - bilhetesNacional;
  const diasSemComprar = semVenda ? 90 + (base % 300) : base % 400;
  const dataUltimaCompraMock = semVenda
    ? null
    : new Date(Date.now() - diasSemComprar * 86_400_000).toISOString();

  const socios = detalhe.representantesLegais.map((representante) => ({
    id: representante.id,
    nome: representante.nome,
    cpf: representante.cpf || null,
    rg: representante.rgNumero,
    email: representante.email || null,
    telefone: representante.telefone || null,
    papel: representante.administrativo ? "Sócio-Administrador" : "Sócio",
    participacaoPct: 10 + (hashParaNumero(representante.id) % 70),
    temRg: representante.rg !== null,
    temProcuracao: representante.procuracao !== null,
  }));

  const enderecoReceita = dadosReceita?.endereco ?? null;
  const enderecoComplementar = detalhe.complementar?.enderecoAgencia ?? null;
  const endereco = enderecoComplementar?.logradouro
    ? {
        logradouro: enderecoComplementar.logradouro,
        numero: enderecoComplementar.numero,
        complemento: enderecoComplementar.complemento,
        bairro: enderecoComplementar.bairro,
        cidade: enderecoComplementar.cidade,
        uf: enderecoComplementar.uf,
        cep: enderecoComplementar.cep,
      }
    : enderecoReceita;

  return {
    id: agencia.id,
    identificador: gerarIdentificador(agencia.razaoSocial),
    categoria,
    temRiscoCadastral: (detalhe.analiseIa?.flagsRisco.length ?? 0) > 0,
    ativoSistema: agencia.status === "ativo",
    ativadoEm: agencia.createdAt.toISOString(),
    dadosDocumentacao: {
      empresa: {
        nomeFantasia: agencia.nomeFantasia,
        razaoSocial: agencia.razaoSocial,
        cnpj: agencia.cnpj,
        statusLabel: labelStatus(agencia.status),
        statusClasses: classesBadgeStatus(agencia.status),
        etapaLabel: labelEtapa(agencia.status),
        situacaoReceita: dadosReceita?.situacaoCadastral ?? null,
        dataAbertura: dadosReceita?.dataAbertura?.toISOString() ?? null,
        tempoDeCnpj: dadosReceita?.dataAbertura ? tempoDecorrido(dadosReceita.dataAbertura) : null,
        capitalSocial: dadosReceita?.capitalSocial ?? null,
        naturezaJuridica: dadosReceita?.naturezaJuridica ?? null,
        porte: dadosReceita?.porte ?? null,
        optanteSimples: dadosReceita?.optanteSimples ?? null,
        emailReceita: dadosReceita?.email ?? null,
        telefoneReceita: dadosReceita?.telefone ?? null,
        cnaePrincipal: (() => {
          const principal = dadosReceita?.cnaes.find((cnae) => cnae.principal);
          return principal?.codigo
            ? { codigo: principal.codigo, descricao: principal.descricao ?? "" }
            : null;
        })(),
        cnaesSecundarios: (dadosReceita?.cnaes ?? [])
          .filter((cnae) => !cnae.principal && cnae.codigo)
          .map((cnae) => ({ codigo: cnae.codigo!, descricao: cnae.descricao ?? "" })),
      },
      datas: {
        dataCadastroLegado: agencia.createdAt.toISOString(),
        tempoComoCliente: tempoDecorrido(agencia.createdAt),
      },
      contato: {
        nome: agencia.nomeFantasia ?? agencia.razaoSocial,
        email: agencia.emailContato,
        telefone1: agencia.telefoneContato,
        telefone1Base: executivoContexto.base,
        telefone2: null,
        telefoneComercial: detalhe.complementar?.telefoneComercial ?? null,
        emailReceita: dadosReceita?.email ?? null,
        telefoneReceita: dadosReceita?.telefone ?? null,
      },
      endereco,
      socios,
    },
    perfilComercial: {
      sica: agencia.sicaCodigo,
      base: executivoContexto.base,
      gestorNome: executivoContexto.gestorNome,
      executivoNome: detalhe.executivoNome,
      segmento: semVenda ? null : ["Lazer", "Corporativo", "Misto"][base % 3]!,
      mediaFaturamento: semVenda ? null : Math.round(volumeAno / 8),
      bancoNome: detalhe.complementar?.bancoNome ?? null,
      bancoCodigo: detalhe.complementar?.bancoCodigo ?? null,
      bancoAgencia: detalhe.complementar?.bancoAgencia ?? null,
      bancoConta: detalhe.complementar?.bancoConta ?? null,
      limiteFaturado: Math.round(volumeAno * (1.1 + ((base >> 4) % 30) / 100)),
      limiteCartao: Math.round(volumeAno * (0.2 + ((base >> 6) % 15) / 100)),
      dataUltimaCompra: dataUltimaCompraMock,
      comissaoPct: 0.5 + ((base >> 2) % 30) / 10,
      incentivoPct: (base >> 5) % 10 === 0 ? 1 + ((base >> 7) % 20) / 10 : 0,
      bloqCred: base % 20 === 0,
    },
    vendas: {
      aereoNacional: {
        volume: volumeNacional,
        bilhetes: bilhetesNacional,
        pctAereo: bilhetesAno > 0 ? Math.round((bilhetesNacional / bilhetesAno) * 100) : 0,
      },
      aereoInternacional: {
        volume: volumeInternacional,
        bilhetes: bilhetesInternacional,
        pctAereo: bilhetesAno > 0 ? Math.round((bilhetesInternacional / bilhetesAno) * 100) : 0,
      },
      terrestre: {
        volume: volumeTerrestre,
        servicos: Math.round(bilhetesAno * 0.08),
        pctMix: volumeAno > 0 ? Math.round((volumeTerrestre / volumeAno) * 100) : 0,
      },
      volumeTotalAno: volumeAno,
      ticketMedioAereo:
        bilhetesAno > 0 ? Math.round((volumeNacional + volumeInternacional) / bilhetesAno) : 0,
      topCompanhias: gerarTopCompanhias(base),
      faturas: gerarFaturas(base, semVenda ? 0 : 5 + (base % 15)),
    },
  };
}
