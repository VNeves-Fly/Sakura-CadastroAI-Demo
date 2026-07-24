import type {
  PrismaClient,
  PasswordResetStatus as PrismaPasswordResetStatus,
} from "@prisma/client";
import type {
  CreatePasswordResetData,
  PasswordResetRecord,
  PasswordResetRepository,
  PasswordResetStatus,
} from "@/modules/users/domain/repositories/password-reset-repository";

type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  codigoHash: string;
  status: PrismaPasswordResetStatus;
  tentativas: number;
  verificadoEm: Date | null;
  usadoEm: Date | null;
  expiraEm: Date;
};

export class PrismaPasswordResetRepository implements PasswordResetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePasswordResetData): Promise<PasswordResetRecord> {
    const record = await this.prisma.passwordResetToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        codigoHash: data.codigoHash,
        expiraEm: data.expiraEm,
      },
    });
    return this.toDomain(record);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null> {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    return record ? this.toDomain(record) : null;
  }

  async incrementAttempts(id: string): Promise<PasswordResetRecord> {
    const record = await this.prisma.passwordResetToken.update({
      where: { id },
      data: { tentativas: { increment: 1 } },
    });
    return this.toDomain(record);
  }

  async markVerified(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { status: "VERIFIED", verificadoEm: new Date() },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { status: "USED", usadoEm: new Date() },
    });
  }

  async deleteActiveByUserId(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId, status: { not: "USED" } },
    });
  }

  private toDomain(record: PasswordResetTokenRecord): PasswordResetRecord {
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      codigoHash: record.codigoHash,
      status: record.status as PasswordResetStatus,
      tentativas: record.tentativas,
      verificadoEm: record.verificadoEm,
      usadoEm: record.usadoEm,
      expiraEm: record.expiraEm,
    };
  }
}
