import type { PrismaClient, UsuarioMaster as UsuarioMasterRecord } from "@prisma/client";
import { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";
import type {
  CreateUsuarioMasterData,
  UsuarioMasterRepository,
} from "@/modules/cadastro/domain/repositories/usuario-master-repository";

export class PrismaUsuarioMasterRepository implements UsuarioMasterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<UsuarioMaster | null> {
    const record = await this.prisma.usuarioMaster.findUnique({
      where: { agenciaId },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateUsuarioMasterData): Promise<UsuarioMaster> {
    const record = await this.prisma.usuarioMaster.create({ data });
    return this.toDomain(record);
  }

  async ativar(agenciaId: string): Promise<UsuarioMaster> {
    const record = await this.prisma.usuarioMaster.update({
      where: { agenciaId },
      data: { ativo: true },
    });
    return this.toDomain(record);
  }

  private toDomain(record: UsuarioMasterRecord): UsuarioMaster {
    return UsuarioMaster.create({
      id: record.id,
      agenciaId: record.agenciaId,
      nome: record.nome,
      email: record.email,
      ativo: record.ativo,
      criadoEm: record.criadoEm,
    });
  }
}
