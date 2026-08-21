import type {
  PrismaClient,
  BiometriaVerificacao as BiometriaVerificacaoRecord,
} from "@prisma/client";
import { BiometriaVerificacao } from "@/modules/cadastro/domain/entities/biometria-verificacao.entity";
import type {
  BiometriaVerificacaoRepository,
  CriarBiometriaVerificacaoInput,
} from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import type { StatusBiometriaVerificacao } from "@/modules/cadastro/domain/enums";

export class PrismaBiometriaVerificacaoRepository implements BiometriaVerificacaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async criarOuSubstituir(input: CriarBiometriaVerificacaoInput): Promise<BiometriaVerificacao> {
    const record = await this.prisma.biometriaVerificacao.upsert({
      where: { contratoId_email: { contratoId: input.contratoId, email: input.email } },
      update: {
        agenciaId: input.agenciaId,
        cpf: input.cpf,
        token: input.token,
        sessionId: input.sessionId,
        personId: input.personId,
        legitimuzUrl: input.legitimuzUrl,
        legitimuzUrlQrCode: input.legitimuzUrlQrCode,
        expiraEm: input.expiraEm,
        status: "pendente",
        linkEnviadoEm: new Date(),
        resolvidoEm: null,
      },
      create: {
        contratoId: input.contratoId,
        agenciaId: input.agenciaId,
        email: input.email,
        cpf: input.cpf,
        token: input.token,
        sessionId: input.sessionId,
        personId: input.personId,
        legitimuzUrl: input.legitimuzUrl,
        legitimuzUrlQrCode: input.legitimuzUrlQrCode,
        expiraEm: input.expiraEm,
        linkEnviadoEm: new Date(),
      },
    });
    return this.toDomain(record);
  }

  async buscarPorToken(token: string): Promise<BiometriaVerificacao | null> {
    const record = await this.prisma.biometriaVerificacao.findUnique({ where: { token } });
    return record ? this.toDomain(record) : null;
  }

  async buscarPorContratoIdEEmail(
    contratoId: string,
    email: string,
  ): Promise<BiometriaVerificacao | null> {
    const record = await this.prisma.biometriaVerificacao.findUnique({
      where: { contratoId_email: { contratoId, email } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByContratoId(contratoId: string): Promise<BiometriaVerificacao[]> {
    const records = await this.prisma.biometriaVerificacao.findMany({ where: { contratoId } });
    return records.map((record) => this.toDomain(record));
  }

  async atualizarStatus(
    id: string,
    status: StatusBiometriaVerificacao,
    resolvidoEm: Date | null,
  ): Promise<void> {
    await this.prisma.biometriaVerificacao.update({
      where: { id },
      data: { status, resolvidoEm },
    });
  }

  async incrementarTentativasLembrete(id: string): Promise<void> {
    await this.prisma.biometriaVerificacao.update({
      where: { id },
      data: { tentativasLembrete: { increment: 1 } },
    });
  }

  private toDomain(record: BiometriaVerificacaoRecord): BiometriaVerificacao {
    return BiometriaVerificacao.create({
      id: record.id,
      contratoId: record.contratoId,
      agenciaId: record.agenciaId,
      email: record.email,
      cpf: record.cpf,
      token: record.token,
      status: record.status,
      sessionId: record.sessionId,
      personId: record.personId,
      legitimuzUrl: record.legitimuzUrl,
      legitimuzUrlQrCode: record.legitimuzUrlQrCode,
      tentativasLembrete: record.tentativasLembrete,
      linkEnviadoEm: record.linkEnviadoEm,
      resolvidoEm: record.resolvidoEm,
      expiraEm: record.expiraEm,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
