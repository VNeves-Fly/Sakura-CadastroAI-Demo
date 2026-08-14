import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

// Reativar manda pro fim da fila atual (mesmo critério de
// CriarSignatarioPadraoUseCase) em vez de devolver ao estágio antigo — que
// pode já ter sido ocupado por outra pessoa enquanto este signatário estava
// removido. O analista reordena depois arrastando na tela.
export class RestaurarSignatarioPadraoUseCase implements UseCase<string, void> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  async execute(id: string): Promise<void> {
    const ativos = await this.signatarioPadraoRepository.findAtivos();
    const proximoEstagio =
      ativos.reduce((max, signatario) => Math.max(max, signatario.estagio), 0) + 1;
    await this.signatarioPadraoRepository.restaurar(id);
    await this.signatarioPadraoRepository.update(id, { estagio: proximoEstagio });
  }
}
