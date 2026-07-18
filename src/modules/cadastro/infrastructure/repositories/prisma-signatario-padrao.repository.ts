import type {
  PapelSignatarioPadrao as PrismaPapelSignatarioPadrao,
  PrismaClient,
  SignatarioPadrao as SignatarioPadraoRecord,
} from "@prisma/client";
import { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type {
  CreateSignatarioPadraoData,
  SignatarioPadraoRepository,
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
      where: { ativo: true },
      orderBy: { ordem: "asc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateSignatarioPadraoData): Promise<SignatarioPadrao> {
    // papel é string union no domínio, mas o Prisma gera seu próprio enum —
    // mesmos valores, tipos nominalmente distintos.
    const record = await this.prisma.signatarioPadrao.create({
      data: { ...data, papel: data.papel as PrismaPapelSignatarioPadrao },
    });
    return this.toDomain(record);
  }

  private toDomain(record: SignatarioPadraoRecord): SignatarioPadrao {
    return SignatarioPadrao.create({
      id: record.id,
      nome: record.nome,
      cargo: record.cargo,
      email: record.email,
      telefone: record.telefone,
      ativo: record.ativo,
      ordem: record.ordem,
      papel: record.papel,
      estagio: record.estagio,
    });
  }
}
