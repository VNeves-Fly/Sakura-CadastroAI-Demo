import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { UserOutput } from "@/modules/users/application/dto/create-user.dto";

// "Remover usuário" em /usuarios — desativa (ativo=false, bloqueia login)
// em vez de apagar a linha. Ver comentário no campo `ativo` em
// schema.prisma: User tem relações sem cascade (Mensagem, análise de
// Conversa, SolicitacaoAtendimentoAgencia) que um DELETE de verdade
// quebraria com erro de FK pra qualquer usuário com histórico de uso.
export class DeactivateUserUseCase implements UseCase<string, UserOutput> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<UserOutput> {
    const current = await this.userRepository.findById(id);

    if (!current) {
      throw new NotFoundError("Usuário");
    }

    const deactivated = await this.userRepository.deactivate(id);
    return deactivated.toJSON();
  }
}
