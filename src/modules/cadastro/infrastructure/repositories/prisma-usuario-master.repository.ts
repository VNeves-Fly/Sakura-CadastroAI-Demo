import type { PrismaClient, UsuarioMaster as UsuarioMasterRecord } from "@prisma/client";
import { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";
import type {
  SalvarUsuarioMasterData,
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

  async salvar(agenciaId: string, data: SalvarUsuarioMasterData): Promise<UsuarioMaster> {
    const campos = {
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      telefone: data.telefone,
      rg: data.rg,
      rgOrgaoEmissor: data.rgOrgaoEmissor,
      rgUf: data.rgUf,
      dataNascimento: data.dataNascimento,
      origemRepresentanteLegalId: data.origemRepresentanteLegalId,
      ativo: true,
      salvoPor: data.salvoPor,
      salvoEm: new Date(),
    };

    const record = await this.prisma.usuarioMaster.upsert({
      where: { agenciaId },
      create: { agenciaId, ...campos },
      update: campos,
    });
    return this.toDomain(record);
  }

  private toDomain(record: UsuarioMasterRecord): UsuarioMaster {
    return UsuarioMaster.create({
      id: record.id,
      agenciaId: record.agenciaId,
      nome: record.nome,
      email: record.email,
      cpf: record.cpf,
      telefone: record.telefone,
      rg: record.rg,
      rgOrgaoEmissor: record.rgOrgaoEmissor,
      rgUf: record.rgUf,
      dataNascimento: record.dataNascimento,
      origemRepresentanteLegalId: record.origemRepresentanteLegalId,
      ativo: record.ativo,
      salvoPor: record.salvoPor,
      salvoEm: record.salvoEm,
      criadoEm: record.criadoEm,
    });
  }
}
