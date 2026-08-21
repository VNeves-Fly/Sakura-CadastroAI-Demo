import type { PrismaClient, Documento as DocumentoRecord } from "@prisma/client";
import type { DocumentAnalysisResultado } from "@/modules/cadastro/domain/services/document-analysis-service";
import type { SicaConsultaResultado } from "@/modules/cadastro/domain/services/sst-service";
import type {
  AnaliseIaResultado,
  AnaliseIaDetalhamento,
  AnaliseIaRawData,
  AnaliseIaStage1,
  AnaliseIaStage2,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import {
  Prisma,
  StatusAgencia as PrismaStatusAgencia,
  StatusContrato as PrismaStatusContrato,
  ResultadoAnaliseIa as PrismaResultadoAnaliseIa,
  TipoDocumento,
} from "@prisma/client";
import { Agencia, temAtualizacaoPendente } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import { documentoRecordToDomain } from "@/modules/cadastro/infrastructure/repositories/prisma-documento.repository";
import {
  CONTRATO_STATUS_ASSINADO,
  CONTRATO_STATUS_AGUARDANDO_ASSINATURA,
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_ANALISE,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  TAMANHO_PAGINA_CADASTROS,
  type AgenciaDetalhe,
  type AgenciaRepository,
  type AgenciaResumoPromotor,
  type AnaliseContratos,
  type AnaliseIaAgenciaDetalhe,
  type CadastroComplementarDetalhe,
  type CadastrosKpis,
  type ContextoMudancaStatus,
  type ContratoPorProvedorId,
  type ContratoSignatarioData,
  type CreateAgenciaData,
  type EnderecoData,
  type FiltroSerieMovimentacao,
  type FonteConsultaCredito,
  type Granularidade,
  type ConsultaSstItem,
  type HistoricoConsultaCreditoItem,
  type HistoricoEtapaCadastroItem,
  type ListarCadastrosFiltros,
  type ListarCadastrosResult,
  type OrigemGeracaoContrato,
  type RepresentanteLegalDetalhe,
  type ResultadoAnaliseIa,
  type SeriePeriodoItem,
  type SeriesMovimentacao,
  type SlaEtapaItem,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

// Etapas "em trânsito" do funil — as únicas em que "tempo até sair dela"
// faz sentido como métrica de SLA (ver calcularSlaPorEtapa). `ativo` e
// `recusado` são estados finais: nunca se sai deles, então não têm SLA.
const ETAPAS_COM_SLA = [
  STATUS_EM_ANALISE,
  STATUS_EM_COMPLEMENTAR,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_ATIVACAO,
];

// Quantidade de baldes por granularidade do seletor DIA/MÊS/ANO (ver
// listarSeriesMovimentacoes) — 14 dias, 12 meses, 5 anos.
const QUANTIDADE_BALDES: Record<Granularidade, number> = { dia: 14, mes: 12, ano: 5 };

// Mesmo formato "dd/MM" já usado em obterAnaliseContratos, estendido pra
// mês ("MM/yyyy") e ano ("yyyy").
function chavePeriodo(data: Date, granularidade: Granularidade): string {
  if (granularidade === "dia") {
    return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
  }
  if (granularidade === "mes") {
    return `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
  }
  return String(data.getFullYear());
}

// Pré-preenche os últimos `quantidade` períodos com 0 (nenhum falta, mesmo
// sem nenhuma linha real) e só depois soma as datas reais em cima —
// mesma lógica de pré-preenchimento de obterAnaliseContratos, generalizada
// pras 3 granularidades.
function bucketarPorPeriodo(
  datas: Date[],
  granularidade: Granularidade,
  quantidade: number,
): SeriePeriodoItem[] {
  const baldes = new Map<string, number>();
  const chavesOrdenadas: string[] = [];
  const agora = new Date();

  for (let i = quantidade - 1; i >= 0; i--) {
    const data = new Date(agora);
    if (granularidade === "dia") data.setDate(data.getDate() - i);
    else if (granularidade === "mes") data.setMonth(data.getMonth() - i);
    else data.setFullYear(data.getFullYear() - i);

    const chave = chavePeriodo(data, granularidade);
    baldes.set(chave, 0);
    chavesOrdenadas.push(chave);
  }

  for (const data of datas) {
    const chave = chavePeriodo(data, granularidade);
    if (baldes.has(chave)) {
      baldes.set(chave, (baldes.get(chave) ?? 0) + 1);
    }
  }

  return chavesOrdenadas.map((periodo) => ({ periodo, quantidade: baldes.get(periodo) ?? 0 }));
}

interface AgenciaRecord {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  etapaAtual: number;
  status: string;
  contratoSocialPath: string;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  createdAt: Date;
  updatedAt: Date;
  sicaCodigo: string | null;
  sicaSalvoPor: string | null;
  sicaSalvoEm: Date | null;
  travelLinkCriado: boolean;
  travelLinkSalvoPor: string | null;
  travelLinkSalvoEm: Date | null;
  executivoId: string | null;
  atualizacaoVistaEm: Date | null;
  atualizacaoVistaPor: string | null;
  infoPendente: boolean;
  infoPendenteRemovidoPor: string | null;
  infoPendenteRemovidoEm: Date | null;
  gateBiometriaAtivo: boolean;
}

const ENDERECO_VAZIO: EnderecoData = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

interface EnderecoRecord {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

function analiseIaParaPrisma(
  resultado: DocumentAnalysisResultado,
): Prisma.AnaliseIaDocumentoCreateWithoutDocumentoInput {
  return {
    camposExtraidos: resultado.camposExtraidos as Prisma.InputJsonValue,
    camposExtras: resultado.camposExtras as Prisma.InputJsonValue,
    confiancaExtracao: resultado.confiancaExtracao,
    alertas: resultado.alertas,
    resumoAnalise: resultado.resumoAnalise,
    textoBruto: resultado.textoBruto,
    formatoValido: resultado.checagens?.formatoValido ?? null,
    camposObrigatoriosPresentes: resultado.checagens?.camposObrigatoriosPresentes ?? null,
    referenciaCruzadaOk: resultado.checagens?.referenciaCruzadaOk ?? null,
    detalhesChecagem: resultado.checagens
      ? (resultado.checagens.detalhes as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    parecer: resultado.parecer ?? null,
    comparacaoOficial: resultado.comparacaoOficial
      ? (resultado.comparacaoOficial as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
  };
}

function analiseIaFinalParaPrisma(
  avaliacao: AnaliseIaResultado,
  resultado: ResultadoAnaliseIa,
): Prisma.AnaliseIaAgenciaCreateWithoutAgenciaInput {
  return {
    resultado: resultado as PrismaResultadoAnaliseIa,
    parecer: avaliacao.parecer ?? null,
    motivo: avaliacao.motivo,
    flagsRisco: avaliacao.flagsRisco ?? [],
    razoes: avaliacao.razoes ?? [],
    detalhamento: avaliacao.detalhamento
      ? (avaliacao.detalhamento as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    stage1: avaliacao.stage1
      ? (avaliacao.stage1 as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    stage2: avaliacao.stage2
      ? (avaliacao.stage2 as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    rawData: avaliacao.rawData
      ? (avaliacao.rawData as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    // Explícito (não só o @default(now()) do create): a linha já existe
    // desde a persistência do cadastro (resultado=EM_ANALISE), então sem
    // isso um upsert de update manteria o avaliadoEm original (hora da
    // persistência) em vez da hora em que a IA de fato terminou.
    avaliadoEm: new Date(),
  };
}

interface AnaliseIaAgenciaRecord {
  resultado: string;
  parecer: string | null;
  motivo: string | null;
  flagsRisco: string[];
  razoes: string[];
  detalhamento: Prisma.JsonValue | null;
  stage1: Prisma.JsonValue | null;
  stage2: Prisma.JsonValue | null;
  rawData: Prisma.JsonValue | null;
  avaliadoEm: Date;
}

function analiseIaAgenciaToDomain(
  record: AnaliseIaAgenciaRecord | null,
): AnaliseIaAgenciaDetalhe | null {
  if (!record) return null;
  return {
    resultado: record.resultado as ResultadoAnaliseIa,
    parecer: record.parecer,
    motivo: record.motivo,
    flagsRisco: record.flagsRisco,
    razoes: record.razoes ?? [],
    detalhamento: record.detalhamento as unknown as AnaliseIaDetalhamento | null,
    stage1: record.stage1 as unknown as AnaliseIaStage1 | null,
    stage2: record.stage2 as unknown as AnaliseIaStage2 | null,
    rawData: record.rawData as unknown as AnaliseIaRawData | null,
    avaliadoEm: record.avaliadoEm,
  };
}

interface HistoricoConsultaCreditoRecord {
  id: string;
  fonte: string;
  sucesso: boolean;
  erro: string | null;
  consultadoPor: string;
  createdAt: Date;
}

function historicoConsultaCreditoToDomain(
  registros: HistoricoConsultaCreditoRecord[],
): HistoricoConsultaCreditoItem[] {
  return registros.map((registro) => ({
    id: registro.id,
    fonte: registro.fonte as FonteConsultaCredito,
    sucesso: registro.sucesso,
    erro: registro.erro,
    consultadoPor: registro.consultadoPor,
    createdAt: registro.createdAt,
  }));
}

interface ConsultaSstRecord {
  id: string;
  sucesso: boolean;
  erro: string | null;
  metodo: string;
  encontrado: boolean;
  codigoEmpresa: number | null;
  nomeEmpresa: string | null;
  telefone: string | null;
  email: string | null;
  empresaStatus: string | null;
  codigoExecutivo: number | null;
  nomeExecutivo: string | null;
  consultadoPor: string | null;
  createdAt: Date;
}

function consultaSstToDomain(registros: ConsultaSstRecord[]): ConsultaSstItem[] {
  return registros.map((registro) => ({
    id: registro.id,
    sucesso: registro.sucesso,
    erro: registro.erro,
    metodo: registro.metodo as "cnpj" | "codigo_empresa",
    encontrado: registro.encontrado,
    codigoEmpresa: registro.codigoEmpresa,
    nomeEmpresa: registro.nomeEmpresa,
    telefone: registro.telefone,
    email: registro.email,
    empresaStatus: registro.empresaStatus as "ativo" | "inativo" | null,
    codigoExecutivo: registro.codigoExecutivo,
    nomeExecutivo: registro.nomeExecutivo,
    consultadoPor: registro.consultadoPor,
    createdAt: registro.createdAt,
  }));
}

function enderecoToDomain(record: EnderecoRecord | null): EnderecoData {
  if (!record) return ENDERECO_VAZIO;
  return {
    cep: record.cep ?? "",
    logradouro: record.logradouro ?? "",
    numero: record.numero ?? "",
    complemento: record.complemento ?? "",
    bairro: record.bairro ?? "",
    cidade: record.cidade ?? "",
    uf: record.uf ?? "",
  };
}

interface RepresentanteLegalRecord {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  isRepresentanteLegal: boolean;
  endereco: EnderecoRecord | null;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  nacionalidade: string | null;
  dataNascimento: Date | null;
  administrativo: boolean | null;
}

// `documentosDaAgencia` já vem ordenado createdAt desc (ver
// obterDetalhe) — o primeiro match de cada tipo é sempre o mais recente,
// ou seja, "o documento atual" daquele slot. Reprovar não apaga a linha
// antiga do banco (fica de histórico/auditoria); quando o cliente
// reenvia, a linha nova (mais recente) passa a ser a atual automaticamente,
// sem precisar de nenhuma flag extra de "ativo".
function documentoAtual(
  documentosDaAgencia: DocumentoRecord[],
  tipo: TipoDocumento,
  representanteLegalId: string | null,
): Documento | null {
  const record = documentosDaAgencia.find(
    (documento) =>
      documento.tipo === tipo && documento.representanteLegalId === representanteLegalId,
  );
  return record ? documentoRecordToDomain(record) : null;
}

function representanteToDomain(
  record: RepresentanteLegalRecord,
  documentosDaAgencia: DocumentoRecord[],
): RepresentanteLegalDetalhe {
  return {
    id: record.id,
    nome: record.nome,
    cpf: record.cpf,
    email: record.email,
    telefone: record.telefone,
    estadoCivil: record.estadoCivil,
    isRepresentanteLegal: record.isRepresentanteLegal,
    endereco: enderecoToDomain(record.endereco),
    rg: documentoAtual(documentosDaAgencia, TipoDocumento.RG_CNPJ, record.id),
    procuracao: documentoAtual(documentosDaAgencia, TipoDocumento.PROCURACAO, record.id),
    rgNumero: record.rg,
    rgOrgaoEmissor: record.rgOrgaoEmissor,
    nacionalidade: record.nacionalidade,
    dataNascimento: record.dataNascimento,
    administrativo: record.administrativo,
  };
}

interface CadastroComplementarRecord {
  id: string;
  telefoneComercial: string | null;
  emailOperacional: string | null;
  emailComercial: string | null;
  emailFinanceiro: string | null;
  enderecoAgencia: EnderecoRecord | null;
  enderecoAgenciaMesmoTitular: boolean | null;
  socioVinculadoEnderecoId: string | null;
  bancoPais: string | null;
  bancoNome: string | null;
  bancoCodigo: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  bancoSwift: string | null;
  tipoConta: string | null;
  favorecidoEhEmpresa: boolean | null;
  favorecidoNome: string | null;
  favorecidoDoc: string | null;
}

function complementarToDomain(record: CadastroComplementarRecord): CadastroComplementarDetalhe {
  return {
    id: record.id,
    telefoneComercial: record.telefoneComercial,
    emailOperacional: record.emailOperacional,
    emailComercial: record.emailComercial,
    emailFinanceiro: record.emailFinanceiro,
    enderecoAgencia: enderecoToDomain(record.enderecoAgencia),
    enderecoAgenciaMesmoTitular: record.enderecoAgenciaMesmoTitular,
    socioVinculadoEnderecoId: record.socioVinculadoEnderecoId,
    bancoPais: record.bancoPais,
    bancoNome: record.bancoNome,
    bancoCodigo: record.bancoCodigo,
    bancoAgencia: record.bancoAgencia,
    bancoConta: record.bancoConta,
    bancoSwift: record.bancoSwift,
    tipoConta: record.tipoConta,
    favorecidoEhEmpresa: record.favorecidoEhEmpresa,
    favorecidoNome: record.favorecidoNome,
    favorecidoDoc: record.favorecidoDoc,
  };
}

// Filtro de igualdade ou `IN`, conforme o filtro veio como valor único ou
// lista (multiselect) — array vazio (nenhuma opção selecionada) vira
// `undefined` pra não gerar um `IN ()` que não bate com nada.
function condicaoFiltroIn(
  valor: string | string[] | undefined,
): string | { in: string[] } | undefined {
  if (!valor) return undefined;
  if (!Array.isArray(valor)) return valor;
  return valor.length > 0 ? { in: valor } : undefined;
}

export class PrismaAgenciaRepository implements AgenciaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCnpj(cnpj: string): Promise<Agencia | null> {
    const record = await this.prisma.agencia.findUnique({ where: { cnpj } });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<Agencia | null> {
    const record = await this.prisma.agencia.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async marcarAtualizacaoComoVista(agenciaId: string, analistaId: string): Promise<void> {
    await this.prisma.agencia.update({
      where: { id: agenciaId },
      data: { atualizacaoVistaEm: new Date(), atualizacaoVistaPor: analistaId },
    });
  }

  async marcarInfoPendente(agenciaId: string): Promise<void> {
    await this.prisma.agencia.update({
      where: { id: agenciaId },
      // Zera o rastro de remoção manual do ciclo anterior — não faz
      // sentido um "removido por/em" antigo sobreviver a um novo pedido.
      data: { infoPendente: true, infoPendenteRemovidoPor: null, infoPendenteRemovidoEm: null },
    });
  }

  async desmarcarInfoPendente(agenciaId: string, analistaId: string): Promise<void> {
    await this.prisma.agencia.update({
      where: { id: agenciaId },
      data: {
        infoPendente: false,
        infoPendenteRemovidoPor: analistaId,
        infoPendenteRemovidoEm: new Date(),
      },
    });
  }

  async findByContratoProvedorId(provedorId: string): Promise<ContratoPorProvedorId | null> {
    const contrato = await this.prisma.contrato.findFirst({
      where: { provedorId },
      select: { id: true, agenciaId: true },
    });
    return contrato ? { agenciaId: contrato.agenciaId, contratoId: contrato.id } : null;
  }

  async obterDetalhe(id: string): Promise<AgenciaDetalhe | null> {
    const record = await this.prisma.agencia.findUnique({
      where: { id },
      include: {
        complementar: { include: { enderecoAgencia: true } },
        // Sócio removido pelo analista (ver RemoverRepresentanteLegalUseCase)
        // some da ficha e de qualquer decisão de negócio derivada daqui
        // (fila de assinatura, geração de contrato, Usuário Master,
        // reconsulta de crédito etc.) — a linha continua no banco só pro
        // histórico de edição (auditoria), fora deste `include`.
        representantesLegais: { where: { ativo: true }, include: { endereco: true } },
        // Todos os documentos da agência numa lista só (sócios +
        // contrato social) — mais barato que incluir por sócio, e
        // `documentoAtual` já filtra por representanteLegalId na hora
        // de montar cada slot.
        documentos: { orderBy: { createdAt: "desc" } },
        contratos: { orderBy: { createdAt: "desc" } },
        analiseIa: true,
        historicoConsultasCredito: { orderBy: { createdAt: "desc" } },
        consultasSst: { orderBy: { createdAt: "desc" } },
        executivo: { select: { nome: true } },
        associacao: { select: { nome: true } },
        evento: { select: { nome: true } },
      },
    });

    if (!record) return null;

    return {
      agencia: this.toDomain(record),
      complementar: record.complementar ? complementarToDomain(record.complementar) : null,
      representantesLegais: record.representantesLegais.map((socio) =>
        representanteToDomain(socio, record.documentos),
      ),
      contratoSocial: documentoAtual(record.documentos, TipoDocumento.CONTRATO_SOCIAL, null),
      contratos: record.contratos.map((contrato) => ({
        id: contrato.id,
        provedorId: contrato.provedorId,
        status: contrato.status,
        origemGeracao: contrato.origemGeracao as OrigemGeracaoContrato,
        createdAt: contrato.createdAt,
      })),
      analiseIa: analiseIaAgenciaToDomain(record.analiseIa),
      historicoConsultaCredito: historicoConsultaCreditoToDomain(record.historicoConsultasCredito),
      consultasSst: consultaSstToDomain(record.consultasSst),
      executivoNome: record.executivo?.nome ?? null,
      associacaoNome: record.associacao?.nome ?? null,
      eventoNome: record.evento?.nome ?? null,
    };
  }

  async create(data: CreateAgenciaData): Promise<Agencia> {
    // Persiste só o que o wizard coletou (status inicial sempre
    // em_analise) — Transação: Agencia + sócios (RepresentanteLegal) são
    // criados primeiro pra existirem ids reais, depois Documentos e
    // CadastroComplementar (que pode referenciar um sócio via FK real).
    // Análise de IA e Contrato não entram aqui: são gravados depois, de
    // forma assíncrona, por AnalisarCadastroUseCase via
    // registrarAnaliseDocumento/registrarAnaliseFinal/criarContrato.
    return this.prisma.$transaction(async (tx) => {
      const agencia = await tx.agencia.create({
        data: {
          razaoSocial: data.razaoSocial,
          nomeFantasia: data.nomeFantasia,
          cnpj: data.cnpj,
          status: data.status as PrismaStatusAgencia,
          contratoSocialPath: data.contratoSocialPath,
          emailContato: data.emailContato,
          telefoneContato: data.telefoneContato,
          origem: data.origem,
          executivoId: data.executivoId,
          associacaoId: data.associacaoId,
          eventoId: data.eventoId,
          representantesLegais: {
            create: data.socios.map((socio) => ({
              nome: socio.nome,
              cpf: socio.cpf,
              email: socio.email,
              telefone: socio.telefone,
              dataNascimento: socio.dataNascimento,
              estadoCivil: socio.estadoCivil,
              rg: socio.rgNumero || null,
              rgOrgaoEmissor: socio.rgOrgaoEmissor || null,
              nacionalidade: socio.nacionalidade || null,
              administrativo: socio.administrativo,
              isRepresentanteLegal: socio.isRepresentanteLegal,
              endereco: { create: socio.endereco },
            })),
          },
        },
        include: { representantesLegais: true },
      });

      // Documento exige `agenciaId` (não só `representanteLegalId`), então
      // não dá pra aninhar dentro do `create` de RepresentanteLegal acima
      // (Prisma não infere FK de um relacionamento irmão dois níveis
      // abaixo) — gravado à parte, correlacionando por CPF (único por
      // agência) em vez de índice, já que a ordem de retorno de um nested
      // create não é garantida.
      const socioRecordPorCpf = new Map(
        agencia.representantesLegais.map((record) => [record.cpf, record]),
      );

      // Contrato social não tem representanteLegalId (pertence à agência
      // como um todo) — mesma tabela Documento, só sem esse vínculo. A
      // análise de IA sobre este documento (AnaliseIaDocumento) é gravada
      // depois, de forma assíncrona, via registrarAnaliseDocumento — não
      // dá mais pra fazer aqui porque a análise só roda depois que a
      // Agência já foi persistida (ver AnalisarCadastroUseCase).
      await tx.documento.create({
        data: {
          agenciaId: agencia.id,
          representanteLegalId: null,
          tipo: TipoDocumento.CONTRATO_SOCIAL,
          gcsPath: data.contratoSocialPath,
          gcsBucket: data.contratoSocialBucket,
        },
      });

      for (const socio of data.socios) {
        const socioRecord = socioRecordPorCpf.get(socio.cpf);
        if (!socioRecord) continue;

        await tx.documento.create({
          data: {
            agenciaId: agencia.id,
            representanteLegalId: socioRecord.id,
            tipo: TipoDocumento.RG_CNPJ,
            gcsPath: socio.rgPath,
            gcsBucket: socio.rgBucket,
          },
        });

        if (socio.procuracaoPath) {
          await tx.documento.create({
            data: {
              agenciaId: agencia.id,
              representanteLegalId: socioRecord.id,
              tipo: TipoDocumento.PROCURACAO,
              gcsPath: socio.procuracaoPath,
              gcsBucket: socio.procuracaoBucket,
            },
          });
        }
      }

      const socioVinculado =
        data.enderecoBanco.socioEnderecoVinculadoIndex !== null
          ? data.socios[data.enderecoBanco.socioEnderecoVinculadoIndex]
          : null;
      const socioVinculadoId = socioVinculado
        ? (socioRecordPorCpf.get(socioVinculado.cpf)?.id ?? null)
        : null;

      await tx.cadastroComplementar.create({
        data: {
          agenciaId: agencia.id,
          telefoneComercial: data.empresa.telefoneComercial,
          emailOperacional: data.empresa.emailOperacional,
          emailComercial: data.empresa.emailComercial,
          emailFinanceiro: data.empresa.emailFinanceiro,
          enderecoAgenciaMesmoTitular: data.enderecoBanco.enderecoMesmoSocio,
          socioVinculadoEnderecoId: socioVinculadoId,
          enderecoAgencia: { create: data.enderecoBanco.endereco },
          bancoPais: data.enderecoBanco.bancoPais,
          bancoNome: data.enderecoBanco.bancoNome,
          bancoCodigo: data.enderecoBanco.bancoCodigo,
          bancoAgencia: data.enderecoBanco.bancoAgencia,
          bancoConta: data.enderecoBanco.bancoConta,
          bancoSwift: data.enderecoBanco.bancoSwift,
          tipoConta: data.enderecoBanco.tipoConta,
          favorecidoEhEmpresa: data.enderecoBanco.favorecidoEhEmpresa,
          favorecidoNome: data.enderecoBanco.favorecidoNome,
          favorecidoDoc: data.enderecoBanco.favorecidoDoc,
        },
      });

      // Criada já aqui (resultado=EM_ANALISE) — um cadastro persistido
      // nunca fica sem essa linha; registrarAnaliseFinal só faz upsert
      // pra atualizar quando a IA terminar (ver AnalisarCadastroUseCase).
      await tx.analiseIaAgencia.create({
        data: {
          agenciaId: agencia.id,
          resultado: PrismaResultadoAnaliseIa.EM_ANALISE,
          flagsRisco: [],
          razoes: [],
        },
      });

      // Marco inicial do SLA — sem status anterior, é o próprio cliente
      // enviando o formulário público que faz a Agencia nascer em
      // "em_analise" (ver FinalizarCadastroUseCase).
      await tx.historicoEtapaCadastro.create({
        data: {
          agenciaId: agencia.id,
          statusAnterior: null,
          statusNovo: agencia.status,
          usuarioEmail: null,
          origem: "sistema - formulario",
        },
      });

      return this.toDomain(agencia);
    });
  }

  async registrarAnaliseDocumento(
    documentoId: string,
    resultado: DocumentAnalysisResultado,
  ): Promise<void> {
    const dados = analiseIaParaPrisma(resultado);
    await this.prisma.analiseIaDocumento.upsert({
      where: { documentoId },
      create: { documentoId, ...dados },
      update: dados,
    });
  }

  async registrarAnaliseFinal(
    agenciaId: string,
    avaliacao: AnaliseIaResultado,
    statusAtual: string,
    novoStatus: string,
    resultado: ResultadoAnaliseIa,
  ): Promise<void> {
    const dados = analiseIaFinalParaPrisma(avaliacao, resultado);
    await this.prisma.$transaction([
      this.prisma.analiseIaAgencia.upsert({
        where: { agenciaId },
        create: { agenciaId, ...dados },
        update: dados,
      }),
      this.prisma.agencia.update({
        where: { id: agenciaId },
        data: { status: novoStatus as PrismaStatusAgencia },
      }),
      // `statusAtual` (não um valor assumido) — a IA pode aprovar direto de
      // em_analise pra aguardando_assinatura, sem passar por
      // em_complementar (ver AnalisarCadastroUseCase), então o par
      // anterior/novo tem que refletir o que de fato aconteceu.
      this.prisma.historicoEtapaCadastro.create({
        data: {
          agenciaId,
          statusAnterior: statusAtual as PrismaStatusAgencia,
          statusNovo: novoStatus as PrismaStatusAgencia,
          usuarioEmail: null,
          origem: "ia",
        },
      }),
    ]);
  }

  async registrarConsultaCredito(
    agenciaId: string,
    data: {
      fonte: FonteConsultaCredito;
      sucesso: boolean;
      erro: string | null;
      stage2: AnaliseIaStage2 | null;
      rawData: AnaliseIaRawData | null;
      consultadoPor: string;
    },
  ): Promise<void> {
    const fonteChave = data.fonte.toLowerCase();
    const resultadoFonte = data.fonte === "AMAT" ? data.stage2?.amat : data.stage2?.sofia;
    const rawResultadoFonte = data.rawData?.[fonteChave];
    await this.prisma.$transaction([
      this.prisma.historicoConsultaCredito.create({
        data: {
          agenciaId,
          fonte: data.fonte,
          sucesso: data.sucesso,
          erro: data.erro,
          resultado: resultadoFonte
            ? (resultadoFonte as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          rawResultado: rawResultadoFonte
            ? (rawResultadoFonte as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          consultadoPor: data.consultadoPor,
        },
      }),
      // Só sobrescreve o estado "atual" (AnaliseIaAgencia.stage2/rawData)
      // quando a reconsulta deu certo — uma falha vira só uma linha de
      // histórico com erro, sem apagar o último dado válido exibido no
      // card (ver ReconsultarCreditoUseCase).
      ...(data.sucesso
        ? [
            this.prisma.analiseIaAgencia.update({
              where: { agenciaId },
              data: {
                stage2: data.stage2
                  ? (data.stage2 as unknown as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
                rawData: data.rawData
                  ? (data.rawData as unknown as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              },
            }),
          ]
        : []),
    ]);
  }

  async registrarConsultaSst(
    agenciaId: string,
    data: {
      sucesso: boolean;
      erro: string | null;
      metodo: "cnpj" | "codigo_empresa";
      resultado: SicaConsultaResultado | null;
      consultadoPor: string | null;
    },
  ): Promise<void> {
    const registro = data.resultado?.registro ?? null;
    await this.prisma.consultaSst.create({
      data: {
        agenciaId,
        sucesso: data.sucesso,
        erro: data.erro,
        metodo: data.metodo,
        encontrado: data.resultado?.encontrado ?? false,
        codigoEmpresa: registro?.codigoEmpresa ?? null,
        nomeEmpresa: registro?.nome ?? null,
        telefone: registro?.telefone ?? null,
        email: registro?.email ?? null,
        empresaStatus: registro?.empresaStatus ?? null,
        codigoExecutivo: registro?.codigoExecutivo ?? null,
        nomeExecutivo: registro?.nomeExecutivo ?? null,
        consultadoPor: data.consultadoPor,
      },
    });
  }

  async atualizarStatus(
    id: string,
    status: string,
    contexto: ContextoMudancaStatus,
  ): Promise<Agencia> {
    return this.prisma.$transaction(async (tx) => {
      const atual = await tx.agencia.findUniqueOrThrow({
        where: { id },
        select: { status: true },
      });
      const record = await tx.agencia.update({
        where: { id },
        // Qualquer transição de status "resolve" o info pendente (ver
        // comentário no schema.prisma) — o cadastro andou, então o que
        // quer que estivesse esperando da agência não trava mais nada.
        data: { status: status as PrismaStatusAgencia, infoPendente: false },
      });
      await tx.historicoEtapaCadastro.create({
        data: {
          agenciaId: id,
          statusAnterior: atual.status,
          statusNovo: status as PrismaStatusAgencia,
          usuarioEmail: contexto.usuarioEmail,
          origem: contexto.origem,
          observacao: contexto.observacao ?? null,
          desbloqueioManual: contexto.desbloqueioManual ?? null,
        },
      });
      return this.toDomain(record);
    });
  }

  async contarNovosCadastros(desde: Date): Promise<number> {
    return this.prisma.agencia.count({ where: { createdAt: { gte: desde } } });
  }

  // Percorre o histórico completo (ordenado por agência, depois por data)
  // uma vez só: pra cada par consecutivo da MESMA agência, o tempo entre as
  // duas linhas é quanto ela ficou na etapa `statusNovo` da linha anterior
  // antes de sair dela. A etapa atual de um cadastro que ainda não saiu de
  // lá (a última linha dele) não tem "próxima linha" ainda, então não entra
  // na média — só trajetos concluídos contam pra SLA.
  async calcularSlaPorEtapa(): Promise<SlaEtapaItem[]> {
    const linhas = await this.prisma.historicoEtapaCadastro.findMany({
      select: { agenciaId: true, statusNovo: true, createdAt: true },
      orderBy: [{ agenciaId: "asc" }, { createdAt: "asc" }],
    });

    const somaMsPorStatus = new Map<string, number>();
    const amostrasPorStatus = new Map<string, number>();

    for (let i = 0; i < linhas.length - 1; i++) {
      const atual = linhas[i];
      const proxima = linhas[i + 1];
      if (!atual || !proxima) continue;
      if (atual.agenciaId !== proxima.agenciaId || !atual.statusNovo) continue;

      const duracaoMs = proxima.createdAt.getTime() - atual.createdAt.getTime();
      somaMsPorStatus.set(
        atual.statusNovo,
        (somaMsPorStatus.get(atual.statusNovo) ?? 0) + duracaoMs,
      );
      amostrasPorStatus.set(atual.statusNovo, (amostrasPorStatus.get(atual.statusNovo) ?? 0) + 1);
    }

    const MS_POR_DIA = 1000 * 60 * 60 * 24;
    return ETAPAS_COM_SLA.map((status) => {
      const amostras = amostrasPorStatus.get(status) ?? 0;
      const somaMs = somaMsPorStatus.get(status) ?? 0;
      return {
        status,
        amostras,
        mediaDias: amostras > 0 ? somaMs / amostras / MS_POR_DIA : null,
      };
    });
  }

  async listarUltimasMovimentacoesEtapa(limite: number): Promise<HistoricoEtapaCadastroItem[]> {
    const linhas = await this.prisma.historicoEtapaCadastro.findMany({
      orderBy: { createdAt: "desc" },
      take: limite,
      include: { agencia: { select: { razaoSocial: true, nomeFantasia: true } } },
    });

    return linhas.map((linha) => ({
      id: linha.id,
      agenciaId: linha.agenciaId,
      agenciaNome: linha.agencia.nomeFantasia ?? linha.agencia.razaoSocial,
      statusAnterior: linha.statusAnterior,
      statusNovo: linha.statusNovo,
      usuarioEmail: linha.usuarioEmail,
      origem: linha.origem,
      observacao: linha.observacao,
      desbloqueioManual: linha.desbloqueioManual,
      detalhes: linha.detalhes,
      createdAt: linha.createdAt,
    }));
  }

  async listarSeriesMovimentacoes(filtro: FiltroSerieMovimentacao): Promise<SeriesMovimentacao> {
    const where: Prisma.HistoricoEtapaCadastroWhereInput = {};
    if (filtro.apenasCriacao) where.statusAnterior = null;
    if (filtro.statusNovo) where.statusNovo = filtro.statusNovo as PrismaStatusAgencia;
    if (filtro.origem) where.origem = filtro.origem;

    const linhas = await this.prisma.historicoEtapaCadastro.findMany({
      where,
      select: { createdAt: true },
    });
    const datas = linhas.map((linha) => linha.createdAt);

    return {
      dia: bucketarPorPeriodo(datas, "dia", QUANTIDADE_BALDES.dia),
      mes: bucketarPorPeriodo(datas, "mes", QUANTIDADE_BALDES.mes),
      ano: bucketarPorPeriodo(datas, "ano", QUANTIDADE_BALDES.ano),
    };
  }

  async atualizarDadosCadastrais(
    id: string,
    data: {
      razaoSocial?: string;
      nomeFantasia?: string | null;
      emailContato?: string;
      telefoneContato?: string;
    },
  ): Promise<Agencia> {
    const record = await this.prisma.agencia.update({
      where: { id },
      data,
    });
    return this.toDomain(record);
  }

  async salvarSica(id: string, data: { codigo: string; salvoPor: string }): Promise<Agencia> {
    const record = await this.prisma.agencia.update({
      where: { id },
      data: {
        sicaCodigo: data.codigo,
        sicaSalvoPor: data.salvoPor,
        sicaSalvoEm: new Date(),
      },
    });
    return this.toDomain(record);
  }

  async salvarTravelLink(
    id: string,
    data: { criado: boolean; salvoPor: string },
  ): Promise<Agencia> {
    const record = await this.prisma.agencia.update({
      where: { id },
      data: {
        travelLinkCriado: data.criado,
        travelLinkSalvoPor: data.salvoPor,
        travelLinkSalvoEm: new Date(),
      },
    });
    return this.toDomain(record);
  }

  async atualizarGateBiometria(id: string, ativo: boolean): Promise<Agencia> {
    const record = await this.prisma.agencia.update({
      where: { id },
      data: { gateBiometriaAtivo: ativo },
    });
    return this.toDomain(record);
  }

  private dadosSignatariosCreate(signatarios: ContratoSignatarioData[]) {
    return signatarios.map((signatario) => ({
      nome: signatario.nome,
      email: signatario.email,
      cpf: signatario.cpf,
      rg: signatario.rgNumero,
      rgOrgaoEmissor: signatario.rgOrgaoEmissor,
      nacionalidade: signatario.nacionalidade,
      estadoCivil: signatario.estadoCivil,
      dataNascimento: signatario.dataNascimento,
      cepSnapshot: signatario.endereco.cep || null,
      logradouroSnapshot: signatario.endereco.logradouro || null,
      numeroSnapshot: signatario.endereco.numero || null,
      complementoSnapshot: signatario.endereco.complemento || null,
      bairroSnapshot: signatario.endereco.bairro || null,
      cidadeSnapshot: signatario.endereco.cidade || null,
      ufSnapshot: signatario.endereco.uf || null,
    }));
  }

  async criarContrato(
    agenciaId: string,
    data: {
      provedorId: string;
      status: string;
      origemGeracao: OrigemGeracaoContrato;
      signatarios: ContratoSignatarioData[];
    },
  ): Promise<{ id: string }> {
    const contrato = await this.prisma.contrato.create({
      data: {
        agenciaId,
        provedorId: data.provedorId,
        status: data.status as PrismaStatusContrato,
        origemGeracao: data.origemGeracao,
        signatarios: { create: this.dadosSignatariosCreate(data.signatarios) },
      },
    });
    return { id: contrato.id };
  }

  // Cria o Contrato e avança o status da Agencia (+ HistoricoEtapaCadastro)
  // numa transação só — evita o estado inconsistente "contrato criado, mas
  // Agencia nunca saiu de em_complementar" quando a segunda escrita falhava
  // depois da primeira (incidente real de produção, 2026-08-19: cadastro
  // cmsxng1sk001f01s6wa3hj8hv ficou com Contrato em aguardando_assinatura e
  // Agencia travada em em_complementar, escondendo os botões de decisão —
  // ver AprovarCadastroComplementarUseCase). criarContrato sozinho continua
  // existindo só pra AnalisarCadastroUseCase, que trata o avanço de status
  // via registrarAnaliseFinal (fluxo separado, não tocado aqui).
  async criarContratoEAvancarStatus(
    agenciaId: string,
    dadosContrato: {
      provedorId: string;
      status: string;
      origemGeracao: OrigemGeracaoContrato;
      signatarios: ContratoSignatarioData[];
    },
    novoStatus: string,
    contexto: ContextoMudancaStatus,
  ): Promise<{ contratoId: string; agencia: Agencia }> {
    return this.prisma.$transaction(async (tx) => {
      const contrato = await tx.contrato.create({
        data: {
          agenciaId,
          provedorId: dadosContrato.provedorId,
          status: dadosContrato.status as PrismaStatusContrato,
          origemGeracao: dadosContrato.origemGeracao,
          signatarios: { create: this.dadosSignatariosCreate(dadosContrato.signatarios) },
        },
      });

      const atual = await tx.agencia.findUniqueOrThrow({
        where: { id: agenciaId },
        select: { status: true },
      });
      const record = await tx.agencia.update({
        where: { id: agenciaId },
        data: { status: novoStatus as PrismaStatusAgencia, infoPendente: false },
      });
      await tx.historicoEtapaCadastro.create({
        data: {
          agenciaId,
          statusAnterior: atual.status,
          statusNovo: novoStatus as PrismaStatusAgencia,
          usuarioEmail: contexto.usuarioEmail,
          origem: contexto.origem,
          observacao: contexto.observacao ?? null,
          desbloqueioManual: contexto.desbloqueioManual ?? null,
        },
      });

      return { contratoId: contrato.id, agencia: this.toDomain(record) };
    });
  }

  async atualizarStatusContrato(contratoId: string, status: string): Promise<void> {
    await this.prisma.contrato.update({
      where: { id: contratoId },
      data: { status: status as PrismaStatusContrato },
    });
  }

  async listar(filtros: ListarCadastrosFiltros): Promise<ListarCadastrosResult> {
    const where: Prisma.AgenciaWhereInput = {};

    if (filtros.busca) {
      const buscaLimpa = filtros.busca.trim();
      const somenteDigitos = buscaLimpa.replace(/\D/g, "");
      where.OR = [
        { razaoSocial: { contains: buscaLimpa, mode: "insensitive" } },
        { emailContato: { contains: buscaLimpa, mode: "insensitive" } },
        ...(somenteDigitos ? [{ cnpj: { contains: somenteDigitos } }] : []),
      ];
    }

    if (filtros.status !== undefined) {
      where.status = Array.isArray(filtros.status)
        ? { in: filtros.status as PrismaStatusAgencia[] }
        : (filtros.status as PrismaStatusAgencia);
    }

    // Combinados numa relação só (em vez de where.executivoId direto) —
    // id/base/gestor podem vir juntos (ex.: filtrar por Base E Gestor ao
    // mesmo tempo), cada um AND entre si.
    const filtroExecutivo: Prisma.PromotorWhereInput = {};
    const executivoCondicao = condicaoFiltroIn(filtros.executivoId);
    if (executivoCondicao !== undefined) filtroExecutivo.id = executivoCondicao;
    const baseCondicao = condicaoFiltroIn(filtros.base);
    if (baseCondicao !== undefined)
      filtroExecutivo.bases = { some: { base: { sigla: baseCondicao } } };
    const gestorIdCondicao = condicaoFiltroIn(filtros.gestorId);
    if (gestorIdCondicao !== undefined) filtroExecutivo.gestorId = gestorIdCondicao;
    if (Object.keys(filtroExecutivo).length > 0) where.executivo = filtroExecutivo;

    const associacaoCondicao = condicaoFiltroIn(filtros.associacaoId);
    if (associacaoCondicao !== undefined) where.associacaoId = associacaoCondicao;

    const eventoCondicao = condicaoFiltroIn(filtros.eventoId);
    if (eventoCondicao !== undefined) where.eventoId = eventoCondicao;

    if (filtros.atendenteAtivoId) {
      where.atendimentosAgencia = {
        some: { analistaId: filtros.atendenteAtivoId, liberadoEm: null },
      };
    }

    if (filtros.infoPendente !== undefined) {
      where.infoPendente = filtros.infoPendente;
    }

    const tamanhoPagina = filtros.tamanhoPagina ?? TAMANHO_PAGINA_CADASTROS;

    const [records, total] = await Promise.all([
      this.prisma.agencia.findMany({
        where,
        orderBy: { [filtros.sortBy ?? "createdAt"]: filtros.sortDir ?? "desc" },
        ...(filtros.todos
          ? {}
          : {
              skip: ((filtros.pagina ?? 1) - 1) * tamanhoPagina,
              take: tamanhoPagina,
            }),
        include: {
          contratos: { orderBy: { createdAt: "desc" }, take: 1 },
          associacao: { select: { nome: true } },
          executivo: {
            select: { nome: true, gestor: { select: { nome: true } } },
          },
          evento: { select: { nome: true } },
        },
      }),
      this.prisma.agencia.count({ where }),
    ]);

    // `distinct` depois de `orderBy: desc` devolve exatamente 1 linha (a
    // mais recente) por agência, numa query só — sem N+1 pra montar a
    // badge da coluna SICA em /cadastros.
    const consultasSicaRecentes = await this.prisma.consultaSst.findMany({
      where: { agenciaId: { in: records.map((record) => record.id) } },
      orderBy: { createdAt: "desc" },
      distinct: ["agenciaId"],
    });
    const consultaSicaPorAgenciaId = new Map(
      consultaSstToDomain(consultasSicaRecentes).map((item, index) => [
        consultasSicaRecentes[index]!.agenciaId,
        item,
      ]),
    );

    // Mesma ideia de `distinct` acima — 1 linha (a mais recente) por
    // agência, numa query só, pra alimentar o badge de "tem atualização
    // pendente" (ver temAtualizacaoPendente) sem N+1.
    const ultimasNotificacoes = await this.prisma.notificacao.findMany({
      where: { agenciaId: { in: records.map((record) => record.id) } },
      orderBy: { createdAt: "desc" },
      distinct: ["agenciaId"],
      select: { agenciaId: true, createdAt: true },
    });
    const ultimaNotificacaoPorAgenciaId = new Map(
      ultimasNotificacoes.map((notificacao) => [notificacao.agenciaId, notificacao.createdAt]),
    );

    return {
      items: records.map((record) => ({
        agencia: this.toDomain(record),
        origemContratoAtual: (record.contratos[0]?.origemGeracao as OrigemGeracaoContrato) ?? null,
        associacaoNome: record.associacao?.nome ?? null,
        executivoNome: record.executivo?.nome ?? null,
        eventoNome: record.evento?.nome ?? null,
        // Cada agência pertence a UMA base só, mas isso nunca foi capturado
        // no cadastro — o promotor responsável pode atender várias bases
        // (ver PromotorBase), então listar todas elas aqui como se fossem
        // "a base da agência" está errado (decisão do usuário, 2026-07-28:
        // melhor deixar em branco do que mostrar um dado ambíguo/errado).
        executivoBase: null,
        executivoGestor: record.executivo?.gestor?.nome ?? null,
        consultaSicaMaisRecente: consultaSicaPorAgenciaId.get(record.id) ?? null,
        temAtualizacaoPendente: temAtualizacaoPendente(
          record.atualizacaoVistaEm,
          ultimaNotificacaoPorAgenciaId.get(record.id) ?? null,
        ),
      })),
      total,
    };
  }

  async obterKpis(): Promise<CadastrosKpis> {
    const [
      emAnalise,
      emComplementar,
      aguardandoAssinatura,
      aguardandoAssinaturaIa,
      aguardandoAssinaturaHumano,
      aguardandoValidacao,
      aguardandoCadastramento,
      aguardandoAtivacao,
      ativas,
      recusadas,
    ] = await Promise.all([
      this.prisma.agencia.count({
        where: { status: STATUS_EM_ANALISE as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({
        where: { status: STATUS_EM_COMPLEMENTAR as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({
        where: { status: STATUS_AGUARDANDO_ASSINATURA as PrismaStatusAgencia },
      }),
      // Breakdown por origem (IA x analista) do card "Aguardando
      // assinatura" — usado só no hover, contado pelo contrato em si (não
      // pela agência) porque é ele que carrega origemGeracao.
      this.prisma.contrato.count({
        where: {
          status: CONTRATO_STATUS_AGUARDANDO_ASSINATURA as PrismaStatusContrato,
          origemGeracao: "ia",
        },
      }),
      this.prisma.contrato.count({
        where: {
          status: CONTRATO_STATUS_AGUARDANDO_ASSINATURA as PrismaStatusContrato,
          origemGeracao: "humano",
        },
      }),
      this.prisma.agencia.count({
        where: { status: STATUS_AGUARDANDO_VALIDACAO as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({
        where: { status: STATUS_AGUARDANDO_CADASTRAMENTO as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({
        where: { status: STATUS_AGUARDANDO_ATIVACAO as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({ where: { status: STATUS_ATIVO as PrismaStatusAgencia } }),
      this.prisma.agencia.count({ where: { status: STATUS_RECUSADO as PrismaStatusAgencia } }),
    ]);

    return {
      emAnalise,
      emComplementar,
      aguardandoAssinatura,
      aguardandoAssinaturaPorOrigem: {
        ia: aguardandoAssinaturaIa,
        humano: aguardandoAssinaturaHumano,
      },
      aguardandoValidacao,
      aguardandoCadastramento,
      aguardandoAtivacao,
      ativas,
      recusadas,
    };
  }

  async obterAnaliseContratos(dias: number): Promise<AnaliseContratos> {
    const desde = new Date();
    desde.setDate(desde.getDate() - (dias - 1));
    desde.setHours(0, 0, 0, 0);

    const contratos = await this.prisma.contrato.findMany({
      where: { createdAt: { gte: desde } },
      select: { status: true, origemGeracao: true, createdAt: true },
    });

    const porOrigem = { ia: 0, humano: 0 };
    const porDiaMap = new Map<string, { assinados: number; pendentes: number }>();

    for (let i = 0; i < dias; i++) {
      const data = new Date(desde);
      data.setDate(data.getDate() + i);
      const chave = `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
      porDiaMap.set(chave, { assinados: 0, pendentes: 0 });
    }

    for (const contrato of contratos) {
      if (contrato.origemGeracao === "ia") porOrigem.ia += 1;
      if (contrato.origemGeracao === "humano") porOrigem.humano += 1;

      const chave = `${String(contrato.createdAt.getDate()).padStart(2, "0")}/${String(contrato.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const balde = porDiaMap.get(chave);
      if (balde) {
        if (contrato.status === CONTRATO_STATUS_ASSINADO) balde.assinados += 1;
        else balde.pendentes += 1;
      }
    }

    const porDia = Array.from(porDiaMap.entries()).map(([dia, valores]) => ({
      dia,
      ...valores,
    }));

    return { porOrigem, porDia };
  }

  async listarPorExecutivoId(promotorId: string): Promise<AgenciaResumoPromotor[]> {
    const registros = await this.prisma.agencia.findMany({
      where: { executivoId: promotorId },
      orderBy: { createdAt: "desc" },
      select: { id: true, razaoSocial: true, cnpj: true, status: true, createdAt: true },
    });

    return registros.map((registro) => ({
      id: registro.id,
      razaoSocial: registro.razaoSocial,
      cnpj: registro.cnpj,
      status: registro.status,
      createdAt: registro.createdAt,
    }));
  }

  private toDomain(record: AgenciaRecord): Agencia {
    return Agencia.create({
      id: record.id,
      razaoSocial: record.razaoSocial,
      nomeFantasia: record.nomeFantasia,
      cnpj: record.cnpj,
      etapaAtual: record.etapaAtual,
      status: record.status,
      contratoSocialPath: record.contratoSocialPath,
      emailContato: record.emailContato,
      telefoneContato: record.telefoneContato,
      origem: record.origem,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      sicaCodigo: record.sicaCodigo,
      sicaSalvoPor: record.sicaSalvoPor,
      sicaSalvoEm: record.sicaSalvoEm,
      travelLinkCriado: record.travelLinkCriado,
      travelLinkSalvoPor: record.travelLinkSalvoPor,
      travelLinkSalvoEm: record.travelLinkSalvoEm,
      executivoId: record.executivoId,
      atualizacaoVistaEm: record.atualizacaoVistaEm,
      atualizacaoVistaPor: record.atualizacaoVistaPor,
      infoPendente: record.infoPendente,
      infoPendenteRemovidoPor: record.infoPendenteRemovidoPor,
      infoPendenteRemovidoEm: record.infoPendenteRemovidoEm,
      gateBiometriaAtivo: record.gateBiometriaAtivo,
    });
  }
}
