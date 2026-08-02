function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
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
