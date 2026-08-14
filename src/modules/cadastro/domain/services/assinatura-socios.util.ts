import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { SignatarioKeySigner } from "@/modules/cadastro/domain/services/contrato-assinatura-service";

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Grava o keySigner capturado na hora da geração do contrato (ver
// D4SignAdapter.cadastrarSignatarios) — best-effort e nunca lança: o
// Contrato já foi criado nesse ponto, então uma falha aqui não pode
// derrubar a aprovação/análise, só deixa esse signatário sem keySigner até
// um sync manual ("Atualizar informações") backfillar depois, exatamente
// como funcionava antes desta captura existir. Usado por
// AprovarCadastroComplementarUseCase e AnalisarCadastroUseCase, os dois
// pontos que chamam ContratoAssinaturaService.gerarEEnviar.
export async function persistirKeySigners(
  contratoAssinaturaRepository: ContratoAssinaturaRepository,
  contratoId: string,
  signatariosKeySigner: SignatarioKeySigner[],
): Promise<void> {
  for (const item of signatariosKeySigner) {
    if (!item.keySigner) continue;
    try {
      await contratoAssinaturaRepository.registrarDestinatario(
        contratoId,
        item.email,
        item.keySigner,
      );
    } catch (error) {
      console.warn(
        `Falha ao persistir keySigner (contratoId=${contratoId}, email=${item.email}): ${String(error)}`,
      );
    }
  }
}

// Todos os sócios (não os signatários fixos da Sakura) já assinaram o
// contrato? Comparação por e-mail normalizado — nem o D4Sign nem o resto do
// projeto garantem casing consistente entre o que foi cadastrado e o que
// volta no webhook/API. Usado tanto pelo webhook (ProcessarWebhookD4SignUseCase)
// quanto pelo sync manual (SincronizarContratoD4SignUseCase) pra decidir se a
// agência pode avançar de aguardando_assinatura pra aguardando_validacao sem
// depender da ordem de chegada dos eventos do D4Sign.
export function todosSociosAssinaram(emailsSocios: string[], emailsAssinados: string[]): boolean {
  if (emailsSocios.length === 0) return false;

  const assinados = new Set(emailsAssinados.map(normalizarEmail));
  return emailsSocios.every((email) => assinados.has(normalizarEmail(email)));
}
