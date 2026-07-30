// Janela de atendimento gratuito da Meta (mensagem de texto livre só é
// permitida até 24h depois da última mensagem do cliente — depois disso é
// preciso um template aprovado). Espelha a mesma constante hoje só no
// client em thread-conversa.tsx.
export const HORAS_JANELA_ATENDIMENTO_META = 24;

// Timeout do pedido de transferência/assunção de atendimento — vale pra
// qualquer canal (chat ou dossiê), já que o atendimento é sempre da
// agência. "Tempo esgotar sem cancelar" é SUCESSO (efetiva a troca).
export const TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS = 60_000;
