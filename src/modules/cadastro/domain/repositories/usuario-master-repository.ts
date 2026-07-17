import type { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";

export interface CreateUsuarioMasterData {
  agenciaId: string;
  nome?: string | null;
  email?: string | null;
}

export interface UsuarioMasterRepository {
  findByAgenciaId(agenciaId: string): Promise<UsuarioMaster | null>;
  create(data: CreateUsuarioMasterData): Promise<UsuarioMaster>;
  ativar(agenciaId: string): Promise<UsuarioMaster>;
}
