import type { PrismaClient, Gestor as GestorRecord, GestorBase, Base } from "@prisma/client";
import { Gestor } from "@/modules/gestores/domain/entities/gestor.entity";
import type {
  AtualizarGestorData,
  CriarGestorData,
  GestorRepository,
} from "@/modules/gestores/domain/repositories/gestor-repository";

type GestorRecordComBases = GestorRecord & { bases: (GestorBase & { base: Base })[] };

const INCLUDE_BASES = { bases: { include: { base: true } } } as const;

function toDomain(record: GestorRecordComBases): Gestor {
  return Gestor.create({
    id: record.id,
    nome: record.nome,
    sica: record.sica,
    email: record.email,
    telefone: record.telefone,
    userId: record.userId,
    bases: record.bases.map((gestorBase) => gestorBase.base.sigla),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export class PrismaGestorRepository implements GestorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Gestor[]> {
    const records = await this.prisma.gestor.findMany({
      orderBy: { nome: "asc" },
      include: INCLUDE_BASES,
    });
    return records.map(toDomain);
  }

  async findById(id: string): Promise<Gestor | null> {
    const record = await this.prisma.gestor.findUnique({
      where: { id },
      include: INCLUDE_BASES,
    });
    return record ? toDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<Gestor | null> {
    const record = await this.prisma.gestor.findUnique({
      where: { userId },
      include: INCLUDE_BASES,
    });
    return record ? toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Gestor | null> {
    const record = await this.prisma.gestor.findFirst({
      where: { email },
      include: INCLUDE_BASES,
    });
    return record ? toDomain(record) : null;
  }

  // Transação: User (se "criar acesso" marcado) + Gestor + bases, tudo
  // atômico — mesmo padrão de prisma-agencia.repository.ts `create()`.
  async criar(data: CriarGestorData): Promise<Gestor> {
    const record = await this.prisma.$transaction(async (tx) => {
      let userId: string | null = null;

      if (data.novoUsuario) {
        const user = await tx.user.create({
          data: {
            name: `${data.novoUsuario.firstName} ${data.novoUsuario.lastName}`.trim(),
            firstName: data.novoUsuario.firstName,
            lastName: data.novoUsuario.lastName,
            email: data.novoUsuario.email,
            phone: data.telefone ?? "",
            cargo: "GESTOR",
            password: data.novoUsuario.passwordHash,
            mustChangePassword: data.novoUsuario.mustChangePassword,
          },
        });
        userId = user.id;
      }

      return tx.gestor.create({
        data: {
          nome: data.nome,
          sica: data.sica,
          email: data.email,
          telefone: data.telefone,
          userId,
          bases: { create: data.baseIds.map((baseId) => ({ baseId })) },
        },
        include: INCLUDE_BASES,
      });
    });

    return toDomain(record);
  }

  async atualizar(id: string, data: AtualizarGestorData): Promise<Gestor> {
    const record = await this.prisma.$transaction(async (tx) => {
      let userId: string | undefined;

      if (data.novoUsuario) {
        const user = await tx.user.create({
          data: {
            name: `${data.novoUsuario.firstName} ${data.novoUsuario.lastName}`.trim(),
            firstName: data.novoUsuario.firstName,
            lastName: data.novoUsuario.lastName,
            email: data.novoUsuario.email,
            phone: data.telefone ?? "",
            cargo: "GESTOR",
            password: data.novoUsuario.passwordHash,
            mustChangePassword: data.novoUsuario.mustChangePassword,
          },
        });
        userId = user.id;
      }

      await tx.gestorBase.deleteMany({ where: { gestorId: id } });

      return tx.gestor.update({
        where: { id },
        data: {
          nome: data.nome,
          sica: data.sica,
          email: data.email,
          telefone: data.telefone,
          ...(userId ? { userId } : {}),
          bases: { create: data.baseIds.map((baseId) => ({ baseId })) },
        },
        include: INCLUDE_BASES,
      });
    });

    return toDomain(record);
  }
}
