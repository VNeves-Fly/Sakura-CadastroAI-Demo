import type { PrismaClient } from "@prisma/client";
import { User } from "@/modules/users/domain/entities/user.entity";
import type {
  CreateUserData,
  UserRepository,
} from "@/modules/users/domain/repositories/user-repository";

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
        name: data.name,
        email: data.email,
        password: data.passwordHash,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return User.create({
      id: record.id,
      name: record.name,
      email: record.email,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
