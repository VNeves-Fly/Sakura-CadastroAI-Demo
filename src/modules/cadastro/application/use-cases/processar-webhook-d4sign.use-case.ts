import type { UseCase } from "@/modules/shared/application/use-case";
import {
  CONTRATO_STATUS_ASSINADO,
  CONTRATO_STATUS_ASSINADO_AGENCIA,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import type { ContratoEmailFalhaEntregaRepository } from "@/modules/cadastro/domain/repositories/contrato-email-falha-entrega-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { ContratoSignatarioRepository } from "@/modules/cadastro/domain/repositories/contrato-signatario-repository";
import { todosSociosAssinaram } from "@/modules/cadastro/domain/services/assinatura-socios.util";

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
//   e quando (é o dado real por linha da Fila de Assinatura do dossiê).
//   Se for o aprovador (papel APROVAR — Jean), marca Contrato.status como
//   assinado_agencia (efeito isolado, visibilidade). A agência avança de
//   duas formas independentes:
//   - aguardando_assinatura → aguardando_validacao: quando TODOS OS SÓCIOS
//     (ContratoSignatario — snapshot congelado do contrato, não os
//     signatários fixos da Sakura) já tiverem assinatura registrada —
//     checado do zero a cada evento "4", não importa quem assinou agora
//     (2026-07-30: antes só avançava quando o aprovador assinava, o que
//     acoplava a validação de evidências dos sócios a esperar o aprovador
//     entrar, às vezes dias depois).
//   - aguardando_validacao → aguardando_cadastramento: quando o APROVADOR
//     (Jean) assina — a assinatura dele em si é a aprovação formal do time
//     de cadastro (2026-07-31, único gatilho — não existe mais botão manual
//     pra essa transição, decisão do usuário: o webhook é a fonte da
//     verdade).
// - "1" (documento finalizado): fecha o contrato como assinado de vez —
//   nesse ponto necessariamente todos já assinaram (o D4Sign só fecha o
//   documento depois do último signatário, incluindo o aprovador), então
//   também "alcança" a agência pro próximo estágio caso algum "4"
//   individual tenha se perdido no caminho (nunca regride).
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
    private readonly contratoSignatarioRepository: ContratoSignatarioRepository,
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

    const agencia = await this.agenciaRepository.obterDetalhe(referencia.agenciaId);
    const contratoAtual = agencia?.contratos.find((c) => c.id === referencia.contratoId);

    // Efeito isolado, independente do avanço da Agencia abaixo: quando o
    // aprovador assina, marca o Contrato como assinado_agencia — só
    // visibilidade (ver labelStatusContrato/montarFilaAssinatura no
    // dossie.adapter.ts), não decide status de Agencia. Guarda contra
    // corrida com processarDocumentoFinalizado (o "1" pode chegar quase
    // junto e já ter fechado o contrato como assinado de vez).
    const signatariosPadrao = await this.signatarioPadraoRepository.findAtivos();
    const ehAprovador = signatariosPadrao.some(
      (padrao) => padrao.papel === "APROVAR" && padrao.email === input.email,
    );
    if (ehAprovador && contratoAtual?.status !== CONTRATO_STATUS_ASSINADO) {
      await this.agenciaRepository.atualizarStatusContrato(
        referencia.contratoId,
        CONTRATO_STATUS_ASSINADO_AGENCIA,
      );
    }

    // Aprovação formal do time de cadastro: o Jean assinando (aprovador)
    // com a agência já em aguardando_validacao é, em si, a aprovação da
    // validação de evidências — único gatilho pra aguardando_cadastramento
    // (idempotente, só age se ainda estiver nesse status).
    if (ehAprovador && agencia?.agencia.status === STATUS_AGUARDANDO_VALIDACAO) {
      await this.agenciaRepository.atualizarStatus(
        referencia.agenciaId,
        STATUS_AGUARDANDO_CADASTRAMENTO,
      );
      return { processado: true };
    }

    if (agencia?.agencia.status !== STATUS_AGUARDANDO_ASSINATURA) {
      return {
        processado: true,
        motivo: "Assinatura registrada — agência não está aguardando assinatura, sem transição.",
      };
    }

    const socios = await this.contratoSignatarioRepository.findByContratoId(referencia.contratoId);
    const assinaturas = await this.contratoAssinaturaRepository.findByContratoId(
      referencia.contratoId,
    );

    // assinadoEm !== null é obrigatório aqui: uma linha em ContratoAssinatura
    // não significa mais "assinou" por si só — pode ser só um destinatário
    // conhecido pelo sync (ver registrarDestinatario).
    if (
      !todosSociosAssinaram(
        socios.map((s) => s.email),
        assinaturas.filter((a) => a.assinadoEm !== null).map((a) => a.email),
      )
    ) {
      return {
        processado: true,
        motivo: "Assinatura registrada — ainda faltam sócios assinar.",
      };
    }

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
    const statusAtual = agencia?.agencia.status;
    // O "1" só chega depois que TODO MUNDO assinou (sócios + aprovador +
    // testemunhas), então a agência já deveria ter avançado sozinha via os
    // "4" individuais — esses três status cobrem tanto o caminho normal
    // quanto webhooks fora de ordem (ex.: o "4" do aprovador se perdeu, mas
    // o "1" final chegou). Fora desse leque (em_complementar, recusado
    // etc.) não tem contrato "em andamento" de verdade pra fechar.
    const agenciaPronta =
      statusAtual === STATUS_AGUARDANDO_ASSINATURA ||
      statusAtual === STATUS_AGUARDANDO_VALIDACAO ||
      statusAtual === STATUS_AGUARDANDO_CADASTRAMENTO;
    if (!agenciaPronta) {
      return { processado: false, motivo: "Agência não está aguardando assinatura." };
    }

    await this.agenciaRepository.atualizarStatusContrato(
      referencia.contratoId,
      CONTRATO_STATUS_ASSINADO,
    );

    // Nunca regride — só "alcança" o próximo estágio se a agência ainda
    // não tiver avançado sozinha via os "4" individuais.
    if (statusAtual === STATUS_AGUARDANDO_ASSINATURA) {
      await this.agenciaRepository.atualizarStatus(
        referencia.agenciaId,
        STATUS_AGUARDANDO_VALIDACAO,
      );
    } else if (statusAtual === STATUS_AGUARDANDO_VALIDACAO) {
      await this.agenciaRepository.atualizarStatus(
        referencia.agenciaId,
        STATUS_AGUARDANDO_CADASTRAMENTO,
      );
    }

    return { processado: true };
  }
}
