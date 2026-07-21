import type { UseCase } from "@/modules/shared/application/use-case";
import type { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";
import type {
  SalvarUsuarioMasterData,
  UsuarioMasterRepository,
} from "@/modules/cadastro/domain/repositories/usuario-master-repository";

export interface SalvarUsuarioMasterInput extends SalvarUsuarioMasterData {
  agenciaId: string;
}

export class SalvarUsuarioMasterUseCase implements UseCase<
  SalvarUsuarioMasterInput,
  UsuarioMaster
> {
  constructor(private readonly usuarioMasterRepository: UsuarioMasterRepository) {}

  execute(input: SalvarUsuarioMasterInput): Promise<UsuarioMaster> {
    const { agenciaId, ...data } = input;
    return this.usuarioMasterRepository.salvar(agenciaId, data);
  }
}
