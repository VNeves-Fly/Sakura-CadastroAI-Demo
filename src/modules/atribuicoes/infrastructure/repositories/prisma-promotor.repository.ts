import type { PrismaClient, Promotor as PromotorRecord, PromotorBase, Base } from "@prisma/client";
import { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type {
  AtualizarPromotorData,
  CriarPromotorData,
  PromotorRepository,
} from "@/modules/atribuicoes/domain/repositories/promotor-repository";

type PromotorRecordComBases = PromotorRecord & { bases: (PromotorBase & { base: Base })[] };

const INCLUDE_BASES = { bases: { include: { base: true } } } as const;

function toDomain(record: PromotorRecordComBases): Promotor {
  return Promotor.create({
    id: record.id,
    sica: record.sica,
    nome: record.nome,
    gestorId: record.gestorId,
    email: record.email,
    telefone: record.telefone,
    link: record.link,
    linkExecutivoId: record.linkExecutivoId,
    bases: record.bases.map((promotorBase) => promotorBase.base.sigla),
    userId: record.userId,
  });
}

export class PrismaPromotorRepository implements PromotorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Promotor[]> {
    const records = await this.prisma.promotor.findMany({
      orderBy: { nome: "asc" },
      include: INCLUDE_BASES,
    });
    return records.map(toDomain);
  }

  async findById(id: string): Promise<Promotor | null> {
    const record = await this.prisma.promotor.findUnique({
      where: { id },
      include: INCLUDE_BASES,
    });
    return record ? toDomain(record) : null;
  }

  async findByLinkExecutivoId(uuid: string): Promise<Promotor | null> {
    const record = await this.prisma.promotor.findFirst({
      where: { linkExecutivoId: { has: uuid } },
      include: INCLUDE_BASES,
    });
    return record ? toDomain(record) : null;
  }

  // findFirst (não findUnique) porque a comparação precisa ser
  // case-insensitive — email não tem `mode` disponível no where de
  // findUnique, só em filtros de findFirst/findMany.
  async findByEmail(email: string): Promise<Promotor | null> {
    const record = await this.prisma.promotor.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      include: INCLUDE_BASES,
    });
    return record ? toDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<Promotor | null> {
    const record = await this.prisma.promotor.findUnique({
      where: { userId },
      include: INCLUDE_BASES,
    });
    return record ? toDomain(record) : null;
  }

  // Transação: User (se "criar acesso" marcado) + Promotor + bases, tudo
  // atômico — mesmo padrão de prisma-gestor.repository.ts `criar()`.
  async criar(data: CriarPromotorData): Promise<Promotor> {
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
            cargo: "EXECUTIVO",
            password: data.novoUsuario.passwordHash,
            mustChangePassword: data.novoUsuario.mustChangePassword,
          },
        });
        userId = user.id;
      }

      return tx.promotor.create({
        data: {
          nome: data.nome,
          sica: data.sica,
          email: data.email,
          telefone: data.telefone,
          gestorId: data.gestorId,
          userId,
          bases: { create: data.baseIds.map((baseId) => ({ baseId })) },
        },
        include: INCLUDE_BASES,
      });
    });

    return toDomain(record);
  }

  async atualizar(id: string, data: AtualizarPromotorData): Promise<Promotor> {
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
            cargo: "EXECUTIVO",
            password: data.novoUsuario.passwordHash,
            mustChangePassword: data.novoUsuario.mustChangePassword,
          },
        });
        userId = user.id;
      }

      await tx.promotorBase.deleteMany({ where: { promotorId: id } });

      return tx.promotor.update({
        where: { id },
        data: {
          nome: data.nome,
          sica: data.sica,
          email: data.email,
          telefone: data.telefone,
          gestorId: data.gestorId,
          ...(userId ? { userId } : {}),
          bases: { create: data.baseIds.map((baseId) => ({ baseId })) },
        },
        include: INCLUDE_BASES,
      });
    });

    return toDomain(record);
  }
}
