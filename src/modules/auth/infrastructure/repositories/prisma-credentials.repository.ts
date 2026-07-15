import type { PrismaClient } from "@prisma/client";
import type {
  CredentialsRecord,
  CredentialsRepository,
} from "@/modules/auth/domain/repositories/credentials-repository";

export class PrismaCredentialsRepository implements CredentialsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<CredentialsRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.password,
    };
  }
}
