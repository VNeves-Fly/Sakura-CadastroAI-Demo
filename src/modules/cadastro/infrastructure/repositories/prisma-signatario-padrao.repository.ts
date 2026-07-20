import type {
  PapelSignatarioPadrao as PrismaPapelSignatarioPadrao,
  PrismaClient,
  SignatarioPadrao as SignatarioPadraoRecord,
} from "@prisma/client";
import { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type {
  CreateSignatarioPadraoData,
  SignatarioPadraoRepository,
  UpdateSignatarioPadraoData,
} from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

export class PrismaSignatarioPadraoRepository implements SignatarioPadraoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<SignatarioPadrao[]> {
    const records = await this.prisma.signatarioPadrao.findMany({
      orderBy: { ordem: "asc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async findAtivos(): Promise<SignatarioPadrao[]> {
    const records = await this.prisma.signatarioPadrao.findMany({
      where: { deletedAt: null },
      orderBy: { ordem: "asc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async findById(id: string): Promise<SignatarioPadrao | null> {
    const record = await this.prisma.signatarioPadrao.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateSignatarioPadraoData): Promise<SignatarioPadrao> {
    // papel é string union no domínio, mas o Prisma gera seu próprio enum —
    // mesmos valores, tipos nominalmente distintos.
    const record = await this.prisma.signatarioPadrao.create({
      data: { ...data, papel: data.papel as PrismaPapelSignatarioPadrao },
    });
    return this.toDomain(record);
  }

  async update(id: string, data: UpdateSignatarioPadraoData): Promise<SignatarioPadrao> {
    const record = await this.prisma.signatarioPadrao.update({
      where: { id },
      data: { ...data, papel: data.papel as PrismaPapelSignatarioPadrao | undefined },
    });
    return this.toDomain(record);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.signatarioPadrao.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restaurar(id: string): Promise<void> {
    await this.prisma.signatarioPadrao.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  private toDomain(record: SignatarioPadraoRecord): SignatarioPadrao {
    return SignatarioPadrao.create({
      id: record.id,
      nome: record.nome,
      cargo: record.cargo,
      email: record.email,
      telefone: record.telefone,
      deletedAt: record.deletedAt,
      ordem: record.ordem,
      papel: record.papel,
      estagio: record.estagio,
    });
  }
}
