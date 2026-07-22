import {
  STATUS_ATIVO,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

// Rótulo específico do Arquivo — mesmo status de domínio de
// status-cadastro.util.ts, só que com a palavra que o analista usa no
// dia a dia pro estado final negativo ("Reprovado", não "Recusado").
// Só os 2 status finais entram aqui — qualquer outro cai no fallback do
// próprio valor bruto, o que não deveria acontecer nesta área.
export function labelStatusArquivo(status: string): string {
  if (status === STATUS_ATIVO) return "Ativo";
  if (status === STATUS_RECUSADO) return "Reprovado";
  return status;
}
