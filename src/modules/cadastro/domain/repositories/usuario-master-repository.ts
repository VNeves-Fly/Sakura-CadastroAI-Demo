import type { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";

export interface SalvarUsuarioMasterData {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  rg: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  dataNascimento: Date | null;
  // Sócio de onde os dados vieram, se houver (null = preenchido manualmente).
  origemRepresentanteLegalId: string | null;
  salvoPor: string;
}

export interface UsuarioMasterRepository {
  findByAgenciaId(agenciaId: string): Promise<UsuarioMaster | null>;
  // Upsert: cria se a agência ainda não tem Usuário Master salvo, atualiza
  // caso contrário — suporta reselecionar sócio/editar e salvar de novo
  // sem duplicar linha (agenciaId é @unique).
  salvar(agenciaId: string, data: SalvarUsuarioMasterData): Promise<UsuarioMaster>;
}
