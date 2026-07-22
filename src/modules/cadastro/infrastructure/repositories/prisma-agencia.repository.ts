import type { PrismaClient, Documento as DocumentoRecord } from "@prisma/client";
import type { DocumentAnalysisResultado } from "@/modules/cadastro/domain/services/document-analysis-service";
import type { AnaliseIaResultado } from "@/modules/cadastro/domain/services/analise-ia-service";
import {
  Prisma,
  StatusAgencia as PrismaStatusAgencia,
  StatusContrato as PrismaStatusContrato,
  TipoDocumento,
} from "@prisma/client";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import { documentoRecordToDomain } from "@/modules/cadastro/infrastructure/repositories/prisma-documento.repository";
import {
  CONTRATO_STATUS_ASSINADO,
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  type AgenciaDetalhe,
  type AgenciaRepository,
  type AnaliseContratos,
  type CadastroComplementarDetalhe,
  type CadastrosKpis,
  type ContratoPorProvedorId,
  type ContratoSignatarioData,
  type CreateAgenciaData,
  type EnderecoData,
  type ListarCadastrosFiltros,
  type ListarCadastrosResult,
  type OrigemGeracaoContrato,
  type RepresentanteLegalDetalhe,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

interface AgenciaRecord {
  id: string;
  razaoSocial: string;
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
  };
}

function analiseIaFinalParaPrisma(
  resultado: AnaliseIaResultado,
): Prisma.AnaliseIaAgenciaCreateWithoutAgenciaInput {
  return {
    parecer: resultado.parecer ?? null,
    motivo: resultado.motivo,
    flagsRisco: resultado.flagsRisco ?? [],
    detalhamento: resultado.detalhamento
      ? (resultado.detalhamento as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
  };
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
  dataNascimento: Date | null;
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
    dataNascimento: record.dataNascimento,
  };
}

interface CadastroComplementarRecord {
  telefoneComercial: string | null;
  emailOperacional: string | null;
  emailComercial: string | null;
  emailFinanceiro: string | null;
  enderecoAgencia: EnderecoRecord | null;
  enderecoAgenciaMesmoTitular: boolean | null;
  socioVinculadoEnderecoId: string | null;
  bancoPais: string | null;
  bancoNome: string | null;
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
    telefoneComercial: record.telefoneComercial,
    emailOperacional: record.emailOperacional,
    emailComercial: record.emailComercial,
    emailFinanceiro: record.emailFinanceiro,
    enderecoAgencia: enderecoToDomain(record.enderecoAgencia),
    enderecoAgenciaMesmoTitular: record.enderecoAgenciaMesmoTitular,
    socioVinculadoEnderecoId: record.socioVinculadoEnderecoId,
    bancoPais: record.bancoPais,
    bancoNome: record.bancoNome,
    bancoAgencia: record.bancoAgencia,
    bancoConta: record.bancoConta,
    bancoSwift: record.bancoSwift,
    tipoConta: record.tipoConta,
    favorecidoEhEmpresa: record.favorecidoEhEmpresa,
    favorecidoNome: record.favorecidoNome,
    favorecidoDoc: record.favorecidoDoc,
  };
}

export class PrismaAgenciaRepository implements AgenciaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCnpj(cnpj: string): Promise<Agencia | null> {
    const record = await this.prisma.agencia.findUnique({ where: { cnpj } });
    return record ? this.toDomain(record) : null;
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
        representantesLegais: { include: { endereco: true } },
        // Todos os documentos da agência numa lista só (sócios +
        // contrato social) — mais barato que incluir por sócio, e
        // `documentoAtual` já filtra por representanteLegalId na hora
        // de montar cada slot.
        documentos: { orderBy: { createdAt: "desc" } },
        contratos: { orderBy: { createdAt: "desc" } },
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
    };
  }

  async create(data: CreateAgenciaData): Promise<Agencia> {
    // Transação: Agencia + sócios (RepresentanteLegal) são criados
    // primeiro pra existirem ids reais, depois CadastroComplementar (que
    // pode referenciar um sócio via FK real) e, se a IA já aprovou, o
    // Contrato + signatários — tudo dentro da mesma transação, sem
    // intervalo visível entre as escritas.
    return this.prisma.$transaction(async (tx) => {
      const agencia = await tx.agencia.create({
        data: {
          razaoSocial: data.razaoSocial,
          cnpj: data.cnpj,
          status: data.status as PrismaStatusAgencia,
          contratoSocialPath: data.contratoSocialPath,
          emailContato: data.emailContato,
          telefoneContato: data.telefoneContato,
          origem: data.origem,
          representantesLegais: {
            create: data.socios.map((socio) => ({
              nome: socio.nome,
              cpf: socio.cpf,
              email: socio.email,
              telefone: socio.telefone,
              dataNascimento: socio.dataNascimento,
              estadoCivil: socio.estadoCivil,
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
      // como um todo) — mesma tabela Documento, só sem esse vínculo.
      // Criado individualmente (não createMany) porque precisamos do id
      // real gerado pra vincular a AnaliseIaDocumento correspondente,
      // dentro da mesma transação.
      const contratoSocialDoc = await tx.documento.create({
        data: {
          agenciaId: agencia.id,
          representanteLegalId: null,
          tipo: TipoDocumento.CONTRATO_SOCIAL,
          gcsPath: data.contratoSocialPath,
          gcsBucket: data.contratoSocialBucket,
        },
      });
      if (data.analiseIaContratoSocial) {
        await tx.analiseIaDocumento.create({
          data: {
            documentoId: contratoSocialDoc.id,
            ...analiseIaParaPrisma(data.analiseIaContratoSocial),
          },
        });
      }

      for (const socio of data.socios) {
        const socioRecord = socioRecordPorCpf.get(socio.cpf);
        if (!socioRecord) continue;

        const rgDoc = await tx.documento.create({
          data: {
            agenciaId: agencia.id,
            representanteLegalId: socioRecord.id,
            tipo: TipoDocumento.RG_CNPJ,
            gcsPath: socio.rgPath,
            gcsBucket: socio.rgBucket,
          },
        });
        if (socio.analiseIa) {
          await tx.analiseIaDocumento.create({
            data: {
              documentoId: rgDoc.id,
              ...analiseIaParaPrisma(socio.analiseIa),
            },
          });
        }

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
          bancoAgencia: data.enderecoBanco.bancoAgencia,
          bancoConta: data.enderecoBanco.bancoConta,
          bancoSwift: data.enderecoBanco.bancoSwift,
          tipoConta: data.enderecoBanco.tipoConta,
          favorecidoEhEmpresa: data.enderecoBanco.favorecidoEhEmpresa,
          favorecidoNome: data.enderecoBanco.favorecidoNome,
          favorecidoDoc: data.enderecoBanco.favorecidoDoc,
        },
      });

      if (data.analiseIaFinal) {
        await tx.analiseIaAgencia.create({
          data: {
            agenciaId: agencia.id,
            ...analiseIaFinalParaPrisma(data.analiseIaFinal),
          },
        });
      }

      if (data.contrato) {
        await tx.contrato.create({
          data: {
            agenciaId: agencia.id,
            provedorId: data.contrato.provedorId,
            status: data.contrato.status as PrismaStatusContrato,
            origemGeracao: data.contrato.origemGeracao,
            signatarios: {
              create: data.contrato.signatarios.map((signatario) => ({
                nome: signatario.nome,
                email: signatario.email,
                cpf: signatario.cpf,
              })),
            },
          },
        });
      }

      return this.toDomain(agencia);
    });
  }

  async atualizarStatus(id: string, status: string): Promise<Agencia> {
    const record = await this.prisma.agencia.update({
      where: { id },
      data: { status: status as PrismaStatusAgencia },
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

  async criarContrato(
    agenciaId: string,
    data: {
      provedorId: string;
      status: string;
      origemGeracao: OrigemGeracaoContrato;
      signatarios: ContratoSignatarioData[];
    },
  ): Promise<void> {
    await this.prisma.contrato.create({
      data: {
        agenciaId,
        provedorId: data.provedorId,
        status: data.status as PrismaStatusContrato,
        origemGeracao: data.origemGeracao,
        signatarios: {
          create: data.signatarios.map((signatario) => ({
            nome: signatario.nome,
            email: signatario.email,
            cpf: signatario.cpf,
          })),
        },
      },
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

    const [records, total] = await Promise.all([
      this.prisma.agencia.findMany({
        where,
        orderBy: { [filtros.sortBy ?? "createdAt"]: filtros.sortDir ?? "desc" },
        include: { contratos: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
      this.prisma.agencia.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        agencia: this.toDomain(record),
        origemContratoAtual: (record.contratos[0]?.origemGeracao as OrigemGeracaoContrato) ?? null,
      })),
      total,
    };
  }

  async obterKpis(): Promise<CadastrosKpis> {
    const [
      emComplementar,
      aguardandoAssinatura,
      aguardandoValidacao,
      aguardandoAtivacao,
      ativas,
      recusadas,
    ] = await Promise.all([
      this.prisma.agencia.count({
        where: { status: STATUS_EM_COMPLEMENTAR as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({
        where: { status: STATUS_AGUARDANDO_ASSINATURA as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({
        where: { status: STATUS_AGUARDANDO_VALIDACAO as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({
        where: { status: STATUS_AGUARDANDO_ATIVACAO as PrismaStatusAgencia },
      }),
      this.prisma.agencia.count({ where: { status: STATUS_ATIVO as PrismaStatusAgencia } }),
      this.prisma.agencia.count({ where: { status: STATUS_RECUSADO as PrismaStatusAgencia } }),
    ]);

    return {
      emComplementar,
      aguardandoAssinatura,
      aguardandoValidacao,
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

  private toDomain(record: AgenciaRecord): Agencia {
    return Agencia.create({
      id: record.id,
      razaoSocial: record.razaoSocial,
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
    });
  }
}
