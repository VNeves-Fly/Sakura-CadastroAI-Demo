import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_ATIVO,
  STATUS_EM_ANALISE,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { StatusAgencia } from "@/modules/cadastro/domain/enums";

// Vocabulário de etapa em português já usado nos cards de fila de
// /cadastros (ver FILAS nessa página) — extraído pra cá pra ser
// reaproveitado também no dashboard (SLA por etapa, últimas
// movimentações), sem duplicar os literais nem correr o risco dos dois
// lugares divergirem.
export const STATUS_AGENCIA_LABEL: Record<StatusAgencia, string> = {
  [STATUS_EM_ANALISE]: "Em análise (IA)",
  [STATUS_EM_COMPLEMENTAR]: "Análise de Documentos",
  [STATUS_AGUARDANDO_ASSINATURA]: "Aguardando assinatura",
  [STATUS_AGUARDANDO_VALIDACAO]: "Validação",
  [STATUS_AGUARDANDO_CADASTRAMENTO]: "Analise de Credito",
  [STATUS_AGUARDANDO_ATIVACAO]: "Usuário Master",
  [STATUS_ATIVO]: "Ativas",
  [STATUS_RECUSADO]: "Recusadas",
};

// Versão tolerante pra quando o status vem de fora do domínio já tipado
// (ex.: HistoricoEtapaCadastroItem.statusAnterior/statusNovo, que ficam
// como `string | null` na travessia Server→Client) — `null` cobre o
// registro inicial (sem etapa anterior, ver comentário de
// HistoricoEtapaCadastroItem); qualquer valor desconhecido cai no próprio
// texto em vez de quebrar.
export function labelStatusAgencia(status: string | null): string {
  if (!status) return "—";
  return STATUS_AGENCIA_LABEL[status as StatusAgencia] ?? status;
}
