import type { UseCase } from "@/modules/shared/application/use-case";
import {
  CONTRATO_STATUS_ASSINADO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface ProcessarWebhookD4SignInput {
  // uuid do documento no D4Sign — é o Contrato.provedorId gravado quando
  // o contrato foi gerado (ver D4SignAdapter.gerarEEnviar).
  provedorId: string;
  // "1" = documento finalizado (todos assinaram), "2" = e-mail não
  // entregue, "3" = cancelado, "4" = um signatário assinou (parcial).
  // Ver docapi.d4sign.com.br/docs/webhook-postback.
  typePost: string;
}

export interface ProcessarWebhookD4SignOutput {
  processado: boolean;
  motivo?: string;
}

// Automatiza o que hoje só acontece manualmente via
// MarcarContratoAssinadoUseCase (ação do analista no admin). Só reage ao
// evento "documento finalizado" (typePost "1") — os demais (e-mail não
// entregue, cancelado, assinatura parcial) não têm uma transição de
// status definida ainda, então só são reconhecidos (200) sem side-effect,
// pra não perder o webhook em retries do D4Sign.
export class ProcessarWebhookD4SignUseCase implements UseCase<
  ProcessarWebhookD4SignInput,
  ProcessarWebhookD4SignOutput
> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(input: ProcessarWebhookD4SignInput): Promise<ProcessarWebhookD4SignOutput> {
    if (input.typePost !== "1") {
      return { processado: false, motivo: `typePost "${input.typePost}" reconhecido, sem ação.` };
    }

    const referencia = await this.agenciaRepository.findByContratoProvedorId(input.provedorId);
    if (!referencia) {
      return { processado: false, motivo: "Contrato não encontrado pra esse provedorId." };
    }

    const agencia = await this.agenciaRepository.obterDetalhe(referencia.agenciaId);
    if (agencia?.agencia.status !== STATUS_AGUARDANDO_ASSINATURA) {
      return { processado: false, motivo: "Agência não está aguardando assinatura." };
    }

    await this.agenciaRepository.atualizarStatusContrato(
      referencia.contratoId,
      CONTRATO_STATUS_ASSINADO,
    );
    await this.agenciaRepository.atualizarStatus(referencia.agenciaId, STATUS_AGUARDANDO_VALIDACAO);

    return { processado: true };
  }
}
