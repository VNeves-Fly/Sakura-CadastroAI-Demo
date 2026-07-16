import {
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

export const STATUS_LABELS: Record<string, string> = {
  [STATUS_EM_COMPLEMENTAR]: "Em Complementar",
  [STATUS_AGUARDANDO_ASSINATURA]: "Aguardando Assinatura",
  [STATUS_AGUARDANDO_VALIDACAO]: "Aguardando Validação",
  [STATUS_AGUARDANDO_ATIVACAO]: "Aguardando Ativação",
  [STATUS_ATIVO]: "Ativo",
  [STATUS_RECUSADO]: "Recusado",
};

export function labelStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// Classes tintadas por status — mesmo tratamento visual usado nos cards
// de KPI, na badge da listagem e na badge do cabeçalho da ficha (estilo
// "pending actions" do mapa-redesign-sakura.html: fundo tintado por
// cor semântica, não neutro).
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  [STATUS_EM_COMPLEMENTAR]: "bg-primary/10 text-primary",
  [STATUS_AGUARDANDO_ASSINATURA]: "bg-info/10 text-info",
  [STATUS_AGUARDANDO_VALIDACAO]: "bg-warning/15 text-warning",
  [STATUS_AGUARDANDO_ATIVACAO]: "bg-violet-glow/15 text-violet-glow",
  [STATUS_ATIVO]: "bg-success/15 text-success",
  [STATUS_RECUSADO]: "bg-destructive/15 text-destructive",
};

export function classesBadgeStatus(status: string): string {
  return STATUS_BADGE_CLASSES[status] ?? "bg-muted text-foreground";
}
