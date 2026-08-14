import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  CONTRATO_STATUS_ASSINADO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface MarcarContratoAssinadoInput {
  id: string;
  marcadoPor: string;
}

// Ação do analista: sem webhook real do D4Sign ainda, o analista marca
// manualmente quando os sócios já assinaram — atualiza o Contrato (pra
// "assinado") e a Agência (pra "aguardando_validacao") juntos.
export class MarcarContratoAssinadoUseCase implements UseCase<
  MarcarContratoAssinadoInput,
  Agencia
> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute({ id, marcadoPor }: MarcarContratoAssinadoInput): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(id);

    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    if (detalhe.agencia.status !== STATUS_AGUARDANDO_ASSINATURA) {
      throw new ConflictError("Este cadastro não está aguardando assinatura.");
    }

    const contratoAtual = detalhe.contratos[0];

    if (!contratoAtual) {
      throw new ConflictError("Nenhum contrato encontrado pra esta agência.");
    }

    await this.agenciaRepository.atualizarStatusContrato(
      contratoAtual.id,
      CONTRATO_STATUS_ASSINADO,
    );

    return this.agenciaRepository.atualizarStatus(id, STATUS_AGUARDANDO_VALIDACAO, {
      usuarioEmail: marcadoPor,
      origem: "usuario",
    });
  }
}
