import {
  STATUS_EM_ANALISE,
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

export const STATUS_LABELS: Record<string, string> = {
  [STATUS_EM_ANALISE]: "Em análise (IA)",
  [STATUS_EM_COMPLEMENTAR]: "Em complementar",
  [STATUS_AGUARDANDO_ASSINATURA]: "Aguardando assinatura",
  [STATUS_AGUARDANDO_VALIDACAO]: "Aguardando validação",
  [STATUS_AGUARDANDO_ATIVACAO]: "Aguardando ativação",
  [STATUS_ATIVO]: "Ativo",
  [STATUS_RECUSADO]: "Recusado",
};

export function labelStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// Cor por semântica de estado, não por cor de marca: âmbar pra tudo que
// ainda está em andamento/depende de ação, verde pra estado final
// positivo, vermelho pra estado final negativo — rosa (marca) fica
// reservado pra elementos de identidade/ação primária, não pra status.
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  [STATUS_EM_ANALISE]: "bg-muted text-foreground",
  [STATUS_EM_COMPLEMENTAR]: "bg-warning-bg text-warning-text",
  [STATUS_AGUARDANDO_ASSINATURA]: "bg-warning-bg text-warning-text",
  [STATUS_AGUARDANDO_VALIDACAO]: "bg-warning-bg text-warning-text",
  [STATUS_AGUARDANDO_ATIVACAO]: "bg-warning-bg text-warning-text",
  [STATUS_ATIVO]: "bg-success-bg text-success-text",
  [STATUS_RECUSADO]: "bg-destructive-bg text-destructive-text",
};

export function classesBadgeStatus(status: string): string {
  return STATUS_BADGE_CLASSES[status] ?? "bg-muted text-foreground";
}
