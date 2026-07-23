// Movido de services/atendimento-api.ts (era só client-side) — agora é a
// fonte única, reimportada pelo front (atendimento-api.ts reexporta) e
// usada server-side pra validar em assumir-atendimento.use-case.ts.
export const HORAS_LIMITE_ASSUMIR = 2;

// Janela de atendimento gratuito da Meta (mensagem de texto livre só é
// permitida até 24h depois da última mensagem do cliente — depois disso é
// preciso um template aprovado). Espelha a mesma constante hoje só no
// client em thread-conversa.tsx.
export const HORAS_JANELA_ATENDIMENTO_META = 24;

// Solicitação de transferência entre analistas expira sozinha depois
// desse tempo sem resposta (contada como recusa). Movido de
// atendimento-api.ts (era só client-side) — agora reimportado por lá.
export const TIMEOUT_TRANSFERENCIA_MS = 60_000;
