import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";

export interface CriarSignatarioPadraoInput {
  nome?: string | null;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  papel: PapelSignatarioPadrao;
}

// `estagio` não é mais escolhido por quem cria — entra sempre no fim da
// fila de assinatura atual (maior estágio ativo + 1); o analista reordena
// depois arrastando na tela (ver ReordenarSignatariosPadraoUseCase). Evita
// a colisão/gap manual de estágio que motivou o drag-and-drop.
export class CriarSignatarioPadraoUseCase implements UseCase<
  CriarSignatarioPadraoInput,
  SignatarioPadrao
> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  async execute(input: CriarSignatarioPadraoInput): Promise<SignatarioPadrao> {
    const ativos = await this.signatarioPadraoRepository.findAtivos();
    const proximoEstagio =
      ativos.reduce((max, signatario) => Math.max(max, signatario.estagio), 0) + 1;
    return this.signatarioPadraoRepository.create({ ...input, estagio: proximoEstagio });
  }
}
