import type { PrismaClient, ContratoSignatario as ContratoSignatarioRecord } from "@prisma/client";
import { ContratoSignatario } from "@/modules/cadastro/domain/entities/contrato-signatario.entity";
import type {
  ContratoSignatarioRepository,
  CreateContratoSignatarioData,
} from "@/modules/cadastro/domain/repositories/contrato-signatario-repository";

export class PrismaContratoSignatarioRepository implements ContratoSignatarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ContratoSignatario | null> {
    const record = await this.prisma.contratoSignatario.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByContratoId(contratoId: string): Promise<ContratoSignatario[]> {
    const records = await this.prisma.contratoSignatario.findMany({
      where: { contratoId },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateContratoSignatarioData): Promise<ContratoSignatario> {
    const record = await this.prisma.contratoSignatario.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: ContratoSignatarioRecord): ContratoSignatario {
    return ContratoSignatario.create({
      id: record.id,
      contratoId: record.contratoId,
      representanteLegalId: record.representanteLegalId,
      signatarioPadraoId: record.signatarioPadraoId,
      nome: record.nome,
      email: record.email,
      cpf: record.cpf,
      rg: record.rg,
      rgOrgaoEmissor: record.rgOrgaoEmissor,
      cargo: record.cargo,
      nacionalidade: record.nacionalidade,
      estadoCivil: record.estadoCivil,
      dataNascimento: record.dataNascimento,
      cepSnapshot: record.cepSnapshot,
      logradouroSnapshot: record.logradouroSnapshot,
      numeroSnapshot: record.numeroSnapshot,
      complementoSnapshot: record.complementoSnapshot,
      bairroSnapshot: record.bairroSnapshot,
      cidadeSnapshot: record.cidadeSnapshot,
      ufSnapshot: record.ufSnapshot,
    });
  }
}
