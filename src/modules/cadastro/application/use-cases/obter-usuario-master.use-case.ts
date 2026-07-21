import type { UseCase } from "@/modules/shared/application/use-case";
import type { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";
import type { UsuarioMasterRepository } from "@/modules/cadastro/domain/repositories/usuario-master-repository";

// `null` é o estado normal de uma agência que ainda não teve o Usuário
// Master salvo pelo analista — não é um erro "não encontrado".
export class ObterUsuarioMasterUseCase implements UseCase<string, UsuarioMaster | null> {
  constructor(private readonly usuarioMasterRepository: UsuarioMasterRepository) {}

  execute(agenciaId: string): Promise<UsuarioMaster | null> {
    return this.usuarioMasterRepository.findByAgenciaId(agenciaId);
  }
}
