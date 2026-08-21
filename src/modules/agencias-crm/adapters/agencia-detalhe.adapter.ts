import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { labelStatus, classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import { tempoDecorrido } from "@/modules/agencias-crm/utils/tempo-decorrido.util";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import {
  gerarMargemAereo,
  gerarMargemTerrestre,
} from "@/modules/agencias-crm/utils/canal-margem-mock.util";
import type { AgenciaDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DadosReceita } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  CadastroComercialSst,
  CanalMargemSst,
  VendasReaisSst,
} from "@/modules/agencias-crm/services/agencia-detalhe.sst-service";
import type {
  AgenciaDetalheView,
  CanalMargem,
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
  executivoNome?: string | null;
}

// Margem/rentabilidade de um canal — real (SST) quando `real` existe;
// mock determinístico como fallback (sem sicaCodigo, sem venda
// detectada, ou integração desligada). `volumeParaMock` só é usado no
// fallback, pra converter o `rentabLYPct` do mock (% do canal) num valor
// absoluto — no caminho real, `rentabilidadeLY` já vem em R$ direto do
// SST, sem precisar de volume nenhum.
function construirMargemCanal(
  real: CanalMargemSst | undefined,
  base: number,
  gerarMock: (base: number) => {
    margemPct: number;
    margemLYPct: number;
    margemVariacaoPct: number;
    rentabLYPct: number;
    rentabLYVariacaoPct: number;
  },
  volumeParaMock: number,
): CanalMargem {
  if (real) {
    const margemVariacaoPct =
      real.margemLYPct !== 0 ? ((real.margemPct - real.margemLYPct) / real.margemLYPct) * 100 : 0;
    const rentabLYVariacaoPct =
      real.rentabilidadeLY !== 0
        ? ((real.rentabilidade - real.rentabilidadeLY) / real.rentabilidadeLY) * 100
        : 0;
    return {
      margemPct: real.margemPct,
      margemLYPct: real.margemLYPct,
      margemVariacaoPct,
      rentabLYValor: real.rentabilidadeLY,
      rentabLYVariacaoPct,
    };
  }

  const mock = gerarMock(base);
  return {
    margemPct: mock.margemPct,
    margemLYPct: mock.margemLYPct,
    margemVariacaoPct: mock.margemVariacaoPct,
    rentabLYValor: Math.round((volumeParaMock * mock.rentabLYPct) / 100),
    rentabLYVariacaoPct: mock.rentabLYVariacaoPct,
  };
}

// Bloco "vendas" + categoria — idêntico pra agência com dossiê local
// (seed = hash do id local) ou só SST (seed = hash do código SICA, ver
// montarAgenciaDetalheViewSst) — extraído pra não duplicar o merge com
// vendasReais entre os dois.
function construirBlocoVendas(
  base: number,
  vendasReais: VendasReaisSst | null,
): Pick<AgenciaDetalheView, "categoria" | "vendas"> & {
  volumeAno: number;
  semVenda: boolean;
  dataUltimaCompra: string | null;
} {
  const semVenda = base % 12 === 0;
  const categoria = semVenda ? null : CATEGORIAS[base % CATEGORIAS.length]!;

  const volumeAnoMock = semVenda ? 0 : ((base % 900) + 30) * 15_000;
  const bilhetesAnoMock = semVenda ? 0 : 30 + (base % 600);
  const volumeNacionalMock = Math.round(volumeAnoMock * 0.55);
  const volumeInternacionalMock = Math.round(volumeAnoMock * 0.4);
  const volumeTerrestreMock = volumeAnoMock - volumeNacionalMock - volumeInternacionalMock;
  const bilhetesNacionalMock = Math.round(bilhetesAnoMock * 0.72);
  const bilhetesInternacionalMock = bilhetesAnoMock - bilhetesNacionalMock;
  const diasSemComprarMock = semVenda ? 90 + (base % 300) : base % 400;
  const dataUltimaCompraMock = semVenda
    ? null
    : new Date(Date.now() - diasSemComprarMock * 86_400_000).toISOString();

  // real (SST, agencia-detalhe.sst-service.ts) quando vendasReais existe;
  // mock determinístico por hash como fallback (sem sicaCodigo, sem
  // venda detectada, ou integração desligada).
  const volumeNacional = vendasReais?.aereoNacional.volume ?? volumeNacionalMock;
  const volumeInternacional = vendasReais?.aereoInternacional.volume ?? volumeInternacionalMock;
  const volumeTerrestre = vendasReais?.terrestre.volume ?? volumeTerrestreMock;
  const bilhetesNacional = vendasReais?.aereoNacional.bilhetes ?? bilhetesNacionalMock;
  const bilhetesInternacional =
    vendasReais?.aereoInternacional.bilhetes ?? bilhetesInternacionalMock;
  const bilhetesAno = bilhetesNacional + bilhetesInternacional;
  const volumeAno = volumeNacional + volumeInternacional + volumeTerrestre;
  const servicosTerrestre = vendasReais?.terrestre.servicos ?? Math.round(bilhetesAno * 0.08);
  // `||`, não `??`: uma data real vinda do SST nunca é string vazia, mas
  // uma agência só-terrestre sem venda detectável pode, em tese, chegar
  // aqui com "" (ver agencia-carteira.sst-service.ts) — trata como
  // "sem dado real" e cai no mock, igual a receber null/undefined.
  const dataUltimaCompra = vendasReais?.dataUltimaCompra || dataUltimaCompraMock;

  const margemAereo = construirMargemCanal(
    vendasReais?.margemAereo,
    base,
    gerarMargemAereo,
    volumeNacional + volumeInternacional,
  );
  const margemTerrestre = construirMargemCanal(
    vendasReais?.margemTerrestre,
    base,
    gerarMargemTerrestre,
    volumeTerrestre,
  );

  return {
    categoria,
    volumeAno,
    semVenda,
    dataUltimaCompra,
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
        servicos: servicosTerrestre,
        pctMix: volumeAno > 0 ? Math.round((volumeTerrestre / volumeAno) * 100) : 0,
      },
      volumeTotalAno: volumeAno,
      ticketMedioAereo:
        vendasReais?.ticketMedioAereo ??
        (bilhetesAno > 0 ? Math.round((volumeNacional + volumeInternacional) / bilhetesAno) : 0),
      topCompanhias: vendasReais?.topCompanhias ?? gerarTopCompanhias(base),
      faturas: vendasReais?.faturas ?? gerarFaturas(base, semVenda ? 0 : 5 + (base % 15)),
      margemAereo,
      margemTerrestre,
    },
  };
}

export function montarAgenciaDetalheView(
  detalhe: AgenciaDetalhe,
  dadosReceita: DadosReceita | null,
  executivoContexto: ExecutivoContexto,
  // real (SST, agencia-detalhe.sst-service.ts) quando a agência tem
  // sicaCodigo e a integração está ligada — `null` quando desligada/sem
  // sicaCodigo, e todo o bloco "vendas" cai no mock por hash de antes
  // desta integração.
  vendasReais: VendasReaisSst | null = null,
): AgenciaDetalheView {
  const agencia = detalhe.agencia;
  const base = hashParaNumero(agencia.id);
  const blocoVendas = construirBlocoVendas(base, vendasReais);

  const socios = detalhe.representantesLegais.map((representante) => ({
    id: representante.id,
    nome: representante.nome,
    cpf: representante.cpf || null,
    rg: representante.rgNumero,
    email: representante.email || null,
    telefone: representante.telefone || null,
    papel: representante.administrativo ? "Sócio-Administrador" : "Sócio",
    // Sem fonte real — Prisma não guarda % de participação societária
    // hoje (pedido do usuário, 2026-08-21: não mockar, mostrar "—").
    participacaoPct: null,
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
    categoria: blocoVendas.categoria,
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
      // Sem fonte real (segmento comercial, faturamento médio, comissão e
      // incentivo não existem em nenhum sistema hoje) — não mockar, UI
      // mostra "—" (pedido do usuário, 2026-08-21).
      segmento: null,
      mediaFaturamento: null,
      bancoNome: detalhe.complementar?.bancoNome ?? null,
      bancoCodigo: detalhe.complementar?.bancoCodigo ?? null,
      bancoAgencia: detalhe.complementar?.bancoAgencia ?? null,
      bancoConta: detalhe.complementar?.bancoConta ?? null,
      limiteFaturado: Math.round(blocoVendas.volumeAno * (1.1 + ((base >> 4) % 30) / 100)),
      limiteCartao: Math.round(blocoVendas.volumeAno * (0.2 + ((base >> 6) % 15) / 100)),
      dataUltimaCompra: blocoVendas.dataUltimaCompra,
      comissaoPct: null,
      incentivoPct: null,
      bloqCred: base % 20 === 0,
    },
    vendas: blocoVendas.vendas,
  };
}

// Página de detalhe (/crm/agencias/[id]) quando o id é um código SICA —
// 100% SST, sem tocar a tabela `Agencia` deste app (decisão do usuário,
// 2026-08-21). Sócios, documentos, análise de risco e dados da Receita
// Federal (CNAE, capital social, situação cadastral) não existem em
// nenhum endpoint do SST — ficam vazios/null em vez de inventados; a UI
// já degrada bem pra esses campos ("Nenhum sócio cadastrado.", "—",
// "Dados bancários não informados"). `null` de retorno = código SICA não
// existe no SST.
export function montarAgenciaDetalheViewSst(
  codigoEmpresa: number,
  cadastroComercial: CadastroComercialSst,
  executivoContexto: ExecutivoContexto,
  vendasReais: VendasReaisSst | null = null,
): AgenciaDetalheView | null {
  const { baseEmpresa, cadastro } = cadastroComercial;
  if (!baseEmpresa) return null;

  const base = hashParaNumero(String(codigoEmpresa));
  const blocoVendas = construirBlocoVendas(base, vendasReais);

  const razaoSocial = cadastro?.razao_social || baseEmpresa.nome_chave || baseEmpresa.nome_fantasia;
  const cnpjDigitos = unmaskCnpj(cadastro?.cnpj ?? baseEmpresa.CNPJ);
  const ativoSistema = baseEmpresa.empresa_ativa === "SIM";

  const endereco = cadastro?.endereco
    ? {
        logradouro: cadastro.endereco,
        numero: cadastro.numero,
        complemento: cadastro.complemento,
        bairro: cadastro.bairro,
        cidade: cadastro.cidade,
        uf: cadastro.estado,
        cep: cadastro.cep,
      }
    : baseEmpresa.endereco
      ? {
          logradouro: baseEmpresa.endereco,
          numero: baseEmpresa.numero !== null ? String(baseEmpresa.numero) : null,
          complemento: baseEmpresa.complemento,
          bairro: baseEmpresa.bairro,
          cidade: baseEmpresa.cidade,
          uf: baseEmpresa.uf,
          cep: baseEmpresa.CEP,
        }
      : null;

  return {
    id: String(codigoEmpresa),
    identificador: gerarIdentificador(razaoSocial),
    categoria: blocoVendas.categoria,
    temRiscoCadastral: false,
    ativoSistema,
    ativadoEm: baseEmpresa.data_cadastro,
    dadosDocumentacao: {
      empresa: {
        // `nome_chave` (não `nome_fantasia`) — é o mesmo nome que já
        // aparece na listagem (roster de /api/agencias/ativas, mesmo
        // valor). `nome_fantasia` no SST é outra coisa: pra agência de
        // dono único costuma ser o nome da pessoa física (ex.: "RAFAEL
        // SILVESTRINI FERREIRA"), não um nome fantasia de verdade —
        // usar ele aqui deixava o nome em destaque da página diferente
        // do nome que o usuário viu na linha da tabela.
        nomeFantasia: baseEmpresa.nome_chave || baseEmpresa.nome_fantasia || null,
        razaoSocial,
        cnpj: cnpjDigitos,
        statusLabel: ativoSistema ? "Ativo" : "Inativo",
        statusClasses: ativoSistema
          ? "bg-success-bg text-success-text"
          : "bg-destructive-bg text-destructive-text",
        etapaLabel: null,
        situacaoReceita: null,
        dataAbertura: null,
        tempoDeCnpj: null,
        capitalSocial: null,
        naturezaJuridica: null,
        porte: null,
        optanteSimples: null,
        emailReceita: null,
        telefoneReceita: null,
        cnaePrincipal: null,
        cnaesSecundarios: [],
      },
      datas: {
        dataCadastroLegado: baseEmpresa.data_cadastro,
        tempoComoCliente: tempoDecorrido(new Date(baseEmpresa.data_cadastro)),
      },
      contato: {
        nome: cadastro?.contato ?? null,
        email: cadastro?.email || baseEmpresa.email_empresa || "",
        telefone1: cadastro?.telefone || baseEmpresa.telefone_principal || "",
        telefone1Base: executivoContexto.base,
        telefone2: null,
        telefoneComercial: null,
        emailReceita: null,
        telefoneReceita: null,
      },
      endereco,
      socios: [],
    },
    perfilComercial: {
      sica: String(codigoEmpresa),
      base: executivoContexto.base,
      gestorNome: executivoContexto.gestorNome,
      executivoNome: executivoContexto.executivoNome ?? baseEmpresa.nome_executivo,
      // Sem fonte real (segmento comercial, faturamento médio, comissão e
      // incentivo não existem em nenhum sistema hoje) — não mockar, UI
      // mostra "—" (pedido do usuário, 2026-08-21).
      segmento: null,
      mediaFaturamento: null,
      bancoNome: null,
      bancoCodigo: null,
      bancoAgencia: null,
      bancoConta: null,
      // real (SST, base-empresa-cadastro) — total já soma limite + adicional.
      limiteFaturado:
        baseEmpresa.total_limite_cred_faturado || baseEmpresa.limite_cred_faturado || 0,
      limiteCartao:
        baseEmpresa.total_limite_cred_cartao_credito || baseEmpresa.limite_cred_cartao_credito || 0,
      dataUltimaCompra: blocoVendas.dataUltimaCompra,
      comissaoPct: null,
      incentivoPct: null,
      bloqCred: baseEmpresa.bloqueio_credito === "SIM",
    },
    vendas: blocoVendas.vendas,
  };
}
