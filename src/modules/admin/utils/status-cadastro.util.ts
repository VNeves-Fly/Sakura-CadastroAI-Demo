import {
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

export const STATUS_LABELS: Record<string, string> = {
  [STATUS_EM_COMPLEMENTAR]: "Em Complementar",
  [STATUS_AGUARDANDO_ASSINATURA]: "Aguardando Assinatura",
  [STATUS_AGUARDANDO_VALIDACAO]: "Aguardando Validação",
  [STATUS_ATIVO]: "Ativo",
  [STATUS_RECUSADO]: "Recusado",
};

export function labelStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
