import type { PrismaClient, Cargo as PrismaCargo } from "@prisma/client";
import { User } from "@/modules/users/domain/entities/user.entity";
import type { Cargo } from "@/modules/users/domain/enums";
import type {
  CreateUserData,
  UserRepository,
} from "@/modules/users/domain/repositories/user-repository";

type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: PrismaCargo;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<User[]> {
    const records = await this.prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateUserData): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        // `name` só existe pra compatibilidade com o módulo auth (ver
        // user.entity.ts) — o módulo users nunca lê esse campo de volta.
        name: `${data.firstName} ${data.lastName}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        cargo: data.cargo,
        mustChangePassword: data.mustChangePassword,
        password: data.passwordHash,
      },
    });
    return this.toDomain(record);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: passwordHash, mustChangePassword: false },
    });
  }

  private toDomain(record: UserRecord): User {
    return User.create({
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone,
      cargo: record.cargo as Cargo,
      mustChangePassword: record.mustChangePassword,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
