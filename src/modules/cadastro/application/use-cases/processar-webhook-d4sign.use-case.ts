import type { UseCase } from "@/modules/shared/application/use-case";
import {
  CONTRATO_STATUS_ASSINADO,
  CONTRATO_STATUS_ASSINADO_AGENCIA,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

export interface ProcessarWebhookD4SignInput {
  // uuid do documento no D4Sign — é o Contrato.provedorId gravado quando
  // o contrato foi gerado (ver D4SignAdapter.gerarEEnviar).
  provedorId: string;
  // "1" = documento finalizado (todos assinaram), "2" = e-mail não
  // entregue, "3" = cancelado, "4" = um signatário assinou (parcial).
  // Ver docapi.d4sign.com.br/docs/webhook-postback.
  typePost: string;
  // E-mail do signatário — presente nos eventos "2" e "4". Usado só no "4"
  // pra identificar se quem assinou foi o aprovador (papel APROVAR).
  email?: string;
}

export interface ProcessarWebhookD4SignOutput {
  processado: boolean;
  motivo?: string;
}

// Automatiza o que hoje só acontece manualmente via
// MarcarContratoAssinadoUseCase (ação do analista no admin). Reage a dois
// eventos:
// - "4" (assinatura individual): se for o aprovador (papel APROVAR,
//   estágio 1 — só ele sozinho nesse estágio), avança a agência sem
//   esperar os signatários fixos restantes (estágio 2, testemunhas)
//   terminarem — processo interno da Sakura continua em paralelo.
// - "1" (documento finalizado): fecha o contrato como assinado de vez.
// Os demais typePost (e-mail não entregue, cancelado, ou assinatura
// individual de quem não é o aprovador) não têm transição definida ainda,
// então só são reconhecidos (200) sem side-effect, pra não perder o
// webhook em retries do D4Sign.
export class ProcessarWebhookD4SignUseCase implements UseCase<
  ProcessarWebhookD4SignInput,
  ProcessarWebhookD4SignOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly signatarioPadraoRepository: SignatarioPadraoRepository,
  ) {}

  async execute(input: ProcessarWebhookD4SignInput): Promise<ProcessarWebhookD4SignOutput> {
    if (input.typePost === "4") {
      return this.processarAssinaturaIndividual(input);
    }

    if (input.typePost !== "1") {
      return { processado: false, motivo: `typePost "${input.typePost}" reconhecido, sem ação.` };
    }

    return this.processarDocumentoFinalizado(input);
  }

  private async processarAssinaturaIndividual(
    input: ProcessarWebhookD4SignInput,
  ): Promise<ProcessarWebhookD4SignOutput> {
    if (!input.email) {
      return { processado: false, motivo: 'typePost "4" sem e-mail do signatário.' };
    }

    const signatariosPadrao = await this.signatarioPadraoRepository.findAtivos();
    const ehAprovador = signatariosPadrao.some(
      (padrao) => padrao.papel === "APROVAR" && padrao.email === input.email,
    );
    if (!ehAprovador) {
      return { processado: false, motivo: "Assinatura individual não é do aprovador — sem ação." };
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
      CONTRATO_STATUS_ASSINADO_AGENCIA,
    );
    await this.agenciaRepository.atualizarStatus(referencia.agenciaId, STATUS_AGUARDANDO_VALIDACAO);

    return { processado: true };
  }

  private async processarDocumentoFinalizado(
    input: ProcessarWebhookD4SignInput,
  ): Promise<ProcessarWebhookD4SignOutput> {
    const referencia = await this.agenciaRepository.findByContratoProvedorId(input.provedorId);
    if (!referencia) {
      return { processado: false, motivo: "Contrato não encontrado pra esse provedorId." };
    }

    const agencia = await this.agenciaRepository.obterDetalhe(referencia.agenciaId);
    // aguardando_assinatura: ninguém avançou ainda (ex.: sem aprovador
    // configurado). aguardando_validacao: já avançou quando o aprovador
    // assinou (processarAssinaturaIndividual) — o "1" só fecha o contrato.
    const agenciaPronta =
      agencia?.agencia.status === STATUS_AGUARDANDO_ASSINATURA ||
      agencia?.agencia.status === STATUS_AGUARDANDO_VALIDACAO;
    if (!agenciaPronta) {
      return { processado: false, motivo: "Agência não está aguardando assinatura." };
    }

    await this.agenciaRepository.atualizarStatusContrato(
      referencia.contratoId,
      CONTRATO_STATUS_ASSINADO,
    );
    // Idempotente: já deve estar aqui se o aprovador assinou antes.
    await this.agenciaRepository.atualizarStatus(referencia.agenciaId, STATUS_AGUARDANDO_VALIDACAO);

    return { processado: true };
  }
}
