import type { PrismaClient } from "@prisma/client";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type {
  AgenciaRepository,
  CreateAgenciaData,
  UploadedDocumentData,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

// Storage local (dev) não tem conceito de bucket — usamos um nome fixo só
// para preencher a coluna `gcsBucket`, que no sistema original vem do GCS.
const LOCAL_BUCKET = "local";

interface CadastroRecord {
  id: string;
  razaoSocial: string | null;
  cnpj: string | null;
  status: string | null;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDocumentoCreateInput(
  documento: UploadedDocumentData,
  tipo: "CONTRATO_SOCIAL" | "RG_CNPJ",
) {
  return {
    tipo,
    fileName: documento.fileName,
    mimeType: documento.mimeType,
    gcsPath: documento.path,
    gcsBucket: LOCAL_BUCKET,
    gcsSize: documento.size,
  };
}

export class PrismaAgenciaRepository implements AgenciaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCnpj(cnpj: string): Promise<Agencia | null> {
    const record = await this.prisma.cadastro.findUnique({ where: { cnpj } });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateAgenciaData): Promise<Agencia> {
    // Documento exige `cadastroId`, então o RG de cada sócio só pode ser
    // criado depois que o Cadastro (e o RepresentanteLegal dono do RG) já
    // existem — por isso duas etapas dentro da mesma transação, em vez de
    // um único `create` aninhado (Prisma não propaga o FK do avô pro neto).
    const record = await this.prisma.$transaction(async (tx) => {
      const cadastro = await tx.cadastro.create({
        data: {
          razaoSocial: data.razaoSocial,
          cnpj: data.cnpj,
          email: data.email,
          telefone: data.telefone,
          origem: data.origem,
          executivoId: data.executivoId,
          associacaoId: data.associacaoId,
          documentos: {
            create: [toDocumentoCreateInput(data.contratoSocialDocumento, "CONTRATO_SOCIAL")],
          },
          representantesLegais: {
            create: data.socios.map((socio) => ({
              nome: socio.nome,
              email: socio.email,
              telefone: socio.telefone,
              origem: socio.origem,
            })),
          },
        },
        include: { representantesLegais: true },
      });

      await Promise.all(
        cadastro.representantesLegais.map((representante, index) => {
          const socio = data.socios[index];
          if (!socio) {
            return null;
          }
          return tx.documento.create({
            data: {
              cadastroId: cadastro.id,
              representanteLegalId: representante.id,
              ...toDocumentoCreateInput(socio.rgDocumento, "RG_CNPJ"),
            },
          });
        }),
      );

      return cadastro;
    });
    return this.toDomain(record);
  }

  private toDomain(record: CadastroRecord): Agencia {
    return Agencia.create({
      id: record.id,
      razaoSocial: record.razaoSocial,
      cnpj: record.cnpj,
      status: record.status,
      email: record.email,
      telefone: record.telefone,
      origem: record.origem,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
