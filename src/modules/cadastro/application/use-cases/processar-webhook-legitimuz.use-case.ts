import type { UseCase } from "@/modules/shared/application/use-case";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoSignatarioRepository } from "@/modules/cadastro/domain/repositories/contrato-signatario-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import { tentarAvancarAposAssinaturaEBiometria } from "@/modules/cadastro/application/use-cases/avancar-status-pos-assinatura.util";
import type { StatusBiometriaVerificacao } from "@/modules/cadastro/domain/enums";

export interface ProcessarWebhookLegitimuzInput {
  // ref_id mandado na hora de iniciar a verificação (get-sdk-url) — é o
  // mesmo token usado na URL pública /cadastro/biometria/[token].
  refId: string;
  // Status cru da Legitimuz — "Aprovado"/"Reprovado"/"Análise Manual" (KYC
  // completo) ou "Liveness Aprovado"/"Liveness Reprovado" (kyc-faceindex,
  // o flow usado aqui). Normalizado por conteúdo (ver normalizarStatus),
  // não por igualdade exata — não temos confirmação ao vivo de qual dos
  // dois formatos a conta realmente manda pro flow kyc-faceindex.
  status: string;
}

export interface ProcessarWebhookLegitimuzOutput {
  processado: boolean;
  motivo?: string;
}

function normalizarStatus(statusCru: string): StatusBiometriaVerificacao | null {
  const valor = statusCru.toLowerCase();
  if (valor.includes("análise manual") || valor.includes("analise manual")) return "analise_manual";
  if (valor.includes("reprovado")) return "reprovado";
  if (valor.includes("aprovado")) return "aprovado";
  return null;
}

// Espelha ProcessarWebhookD4SignUseCase — recebe o evento já normalizado
// pela rota (webhook-legitimuz.routes.ts trata os dois formatos de payload
// documentados: o evento inicial e a atualização de revisão manual),
// resolve a verificação pelo token (=ref_id) e atualiza o status. Quando o
// resultado é "aprovado", também tenta avançar Agencia.status — decisão do
// usuário (2026-08-25): com o gate ativo, os sócios podem terminar de
// assinar e de validar a biometria em QUALQUER ordem, então tanto esse
// webhook quanto o do D4Sign precisam checar "será que agora está tudo
// pronto?" (ver tentarAvancarAposAssinaturaEBiometria — sem isso, se a
// biometria do último sócio for aprovada DEPOIS de todo mundo já ter
// assinado, nada nunca avançaria a agência).
export class ProcessarWebhookLegitimuzUseCase implements UseCase<
  ProcessarWebhookLegitimuzInput,
  ProcessarWebhookLegitimuzOutput
> {
  constructor(
    private readonly biometriaVerificacaoRepository: BiometriaVerificacaoRepository,
    private readonly agenciaRepository: AgenciaRepository,
    private readonly contratoSignatarioRepository: ContratoSignatarioRepository,
    private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository,
  ) {}

  async execute(input: ProcessarWebhookLegitimuzInput): Promise<ProcessarWebhookLegitimuzOutput> {
    const status = normalizarStatus(input.status);
    if (!status) {
      return { processado: false, motivo: `Status "${input.status}" não reconhecido.` };
    }

    const verificacao = await this.biometriaVerificacaoRepository.buscarPorToken(input.refId);
    if (!verificacao) {
      return {
        processado: false,
        motivo: "Verificação de biometria não encontrada pra esse ref_id.",
      };
    }

    await this.biometriaVerificacaoRepository.atualizarStatus(
      verificacao.id,
      status,
      status === "pendente" ? null : new Date(),
    );

    if (status === "aprovado") {
      const detalhe = await this.agenciaRepository.obterDetalhe(verificacao.agenciaId);
      if (
        detalhe?.agencia.gateBiometriaAtivo &&
        detalhe.agencia.status === STATUS_AGUARDANDO_ASSINATURA
      ) {
        await tentarAvancarAposAssinaturaEBiometria(
          this.agenciaRepository,
          this.contratoSignatarioRepository,
          this.contratoAssinaturaRepository,
          this.biometriaVerificacaoRepository,
          verificacao.agenciaId,
          verificacao.contratoId,
          true,
          { usuarioEmail: null, origem: "sistema - legitimuz" },
        );
      }
    }

    return { processado: true };
  }
}
