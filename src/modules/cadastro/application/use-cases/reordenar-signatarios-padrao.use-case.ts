import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError } from "@/modules/shared/domain/errors";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

// Persiste a nova ordem da fila de assinatura (drag-and-drop na tela de
// Signatários do Contrato) — `idsEmOrdem` vira estágio sequencial
// (1, 2, 3...) via SignatarioPadraoRepository.reordenar. Valida contra os
// ativos atuais pra pegar estado desatualizado (alguém removeu/criou um
// signatário em outra aba enquanto esta lista estava sendo arrastada) — a
// Server Action é chamável direto, então essa checagem não é só defesa de UI.
export class ReordenarSignatariosPadraoUseCase implements UseCase<string[], void> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  async execute(idsEmOrdem: string[]): Promise<void> {
    const ativos = await this.signatarioPadraoRepository.findAtivos();
    const idsAtivos = new Set(ativos.map((signatario) => signatario.id));
    const idsUnicos = new Set(idsEmOrdem);

    if (
      idsUnicos.size !== idsEmOrdem.length ||
      idsEmOrdem.length !== idsAtivos.size ||
      !idsEmOrdem.every((id) => idsAtivos.has(id))
    ) {
      throw new DomainError(
        "A lista de signatários mudou enquanto você reordenava — atualize a página e tente de novo.",
      );
    }

    await this.signatarioPadraoRepository.reordenar(idsEmOrdem);
  }
}
