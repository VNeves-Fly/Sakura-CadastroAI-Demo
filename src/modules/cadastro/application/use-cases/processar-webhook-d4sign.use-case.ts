import type { UseCase } from "@/modules/shared/application/use-case";
import {
  CONTRATO_STATUS_ASSINADO,
  CONTRATO_STATUS_ASSINADO_AGENCIA,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import type { ContratoEmailFalhaEntregaRepository } from "@/modules/cadastro/domain/repositories/contrato-email-falha-entrega-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";

export interface ProcessarWebhookD4SignInput {
  // uuid do documento no D4Sign — é o Contrato.provedorId gravado quando
  // o contrato foi gerado (ver D4SignAdapter.gerarEEnviar).
  provedorId: string;
  // "1" = documento finalizado (todos assinaram), "2" = e-mail não
  // entregue, "3" = cancelado, "4" = um signatário assinou (parcial).
  // Ver docapi.d4sign.com.br/docs/webhook-postback.
  typePost: string;
  // E-mail do signatário — presente nos eventos "2" e "4". No "4" usado
  // pra identificar se quem assinou foi o aprovador (papel APROVAR); no
  // "2" identifica quem não recebeu o e-mail.
  email?: string;
  // Mensagem/motivo do evento — presente no "2" (ex.: motivo da falha de
  // entrega). Guardado como está, sem parsing.
  message?: string;
}

export interface ProcessarWebhookD4SignOutput {
  processado: boolean;
  motivo?: string;
}

// Automatiza o que hoje só acontece manualmente via
// MarcarContratoAssinadoUseCase (ação do analista no admin). Reage a três
// eventos:
// - "4" (assinatura individual): grava em ContratoAssinatura quem assinou
//   e quando (é o dado real por linha da Fila de Assinatura do dossiê) e,
//   se for o aprovador (papel APROVAR, estágio 1 — só ele sozinho nesse
//   estágio), avança a agência sem esperar os signatários fixos restantes
//   (estágio 2, testemunhas) terminarem — processo interno da Sakura
//   continua em paralelo.
// - "1" (documento finalizado): fecha o contrato como assinado de vez.
// - "2" (e-mail não entregue): registra em ContratoEmailFalhaEntrega, pra
//   aparecer como indicativo na tela de Contrato do admin — não muda
//   status de nada, é só visibilidade pro analista perceber que aquele
//   signatário nunca vai receber o convite sem uma ação manual.
// "3" (cancelado no D4Sign) ainda não tem transição definida, então só é
// reconhecido (200) sem side-effect, pra não perder o webhook em retries
// do D4Sign.
export class ProcessarWebhookD4SignUseCase implements UseCase<
  ProcessarWebhookD4SignInput,
  ProcessarWebhookD4SignOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly signatarioPadraoRepository: SignatarioPadraoRepository,
    private readonly contratoEmailFalhaEntregaRepository: ContratoEmailFalhaEntregaRepository,
    private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository,
  ) {}

  async execute(input: ProcessarWebhookD4SignInput): Promise<ProcessarWebhookD4SignOutput> {
    if (input.typePost === "4") {
      return this.processarAssinaturaIndividual(input);
    }

    if (input.typePost === "2") {
      return this.processarEmailNaoEntregue(input);
    }

    if (input.typePost !== "1") {
      return { processado: false, motivo: `typePost "${input.typePost}" reconhecido, sem ação.` };
    }

    return this.processarDocumentoFinalizado(input);
  }

  private async processarEmailNaoEntregue(
    input: ProcessarWebhookD4SignInput,
  ): Promise<ProcessarWebhookD4SignOutput> {
    if (!input.email) {
      return { processado: false, motivo: 'typePost "2" sem e-mail do signatário.' };
    }

    const referencia = await this.agenciaRepository.findByContratoProvedorId(input.provedorId);
    if (!referencia) {
      return { processado: false, motivo: "Contrato não encontrado pra esse provedorId." };
    }

    await this.contratoEmailFalhaEntregaRepository.registrar(
      referencia.contratoId,
      input.email,
      input.message ?? null,
    );

    return { processado: true };
  }

  private async processarAssinaturaIndividual(
    input: ProcessarWebhookD4SignInput,
  ): Promise<ProcessarWebhookD4SignOutput> {
    if (!input.email) {
      return { processado: false, motivo: 'typePost "4" sem e-mail do signatário.' };
    }

    const referencia = await this.agenciaRepository.findByContratoProvedorId(input.provedorId);
    if (!referencia) {
      return { processado: false, motivo: "Contrato não encontrado pra esse provedorId." };
    }

    // Log de assinatura gravado pra TODO signatário (sócio, aprovador ou
    // testemunha), antes de qualquer decisão de status — o D4Sign não
    // manda o timestamp no postback, então vale o momento do recebimento.
    await this.contratoAssinaturaRepository.registrar(referencia.contratoId, input.email);

    const signatariosPadrao = await this.signatarioPadraoRepository.findAtivos();
    const ehAprovador = signatariosPadrao.some(
      (padrao) => padrao.papel === "APROVAR" && padrao.email === input.email,
    );
    if (!ehAprovador) {
      return {
        processado: true,
        motivo: "Assinatura registrada — signatário não é o aprovador, sem transição de status.",
      };
    }

    const agencia = await this.agenciaRepository.obterDetalhe(referencia.agenciaId);
    if (agencia?.agencia.status !== STATUS_AGUARDANDO_ASSINATURA) {
      return {
        processado: true,
        motivo: "Assinatura registrada — agência não está aguardando assinatura, sem transição.",
      };
    }

    // Guarda contra corrida com processarDocumentoFinalizado: os dois
    // webhooks ("4" do aprovador e "1" do documento inteiro) podem chegar
    // quase juntos: se o contrato já foi fechado como assinado (mesmo com
    // a agência ainda não refletindo isso — as duas escritas abaixo não
    // são atômicas), não regride pra assinado_agencia.
    const contratoAtual = agencia.contratos.find((c) => c.id === referencia.contratoId);
    if (contratoAtual?.status === CONTRATO_STATUS_ASSINADO) {
      return {
        processado: true,
        motivo: "Assinatura registrada — contrato já finalizado, sem transição.",
      };
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
