import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";

// Espelha 1:1 o campo `act` da API do D4Sign — ver enum PapelSignatarioPadrao
// no schema e ACT_POR_PAPEL em d4sign.adapter.ts.
export const PAPEL_SIGNATARIO_PADRAO_LABELS: Record<PapelSignatarioPadrao, string> = {
  ASSINAR: "Assinar",
  APROVAR: "Aprovar",
  RECONHECER: "Reconhecer",
  ASSINAR_COMO_PARTE: "Assinar como parte",
  ASSINAR_COMO_TESTEMUNHA: "Assinar como testemunha",
  ASSINAR_COMO_INTERVENIENTE: "Assinar como interveniente",
  ACUSAR_RECEBIMENTO: "Acusar recebimento",
  ASSINAR_COMO_EMISSOR_ENDOSSANTE_AVALISTA: "Assinar como emissor, endossante e avalista",
  ASSINAR_COMO_EMISSOR_ENDOSSANTE_AVALISTA_FIADOR:
    "Assinar como emissor, endossante, avalista e fiador",
  ASSINAR_COMO_FIADOR: "Assinar como fiador",
  ASSINAR_COMO_PARTE_E_FIADOR: "Assinar como parte e fiador",
  ASSINAR_COMO_RESPONSAVEL_SOLIDARIO: "Assinar como responsável solidário",
  ASSINAR_COMO_PARTE_E_RESPONSAVEL_SOLIDARIO: "Assinar como parte e responsável solidário",
};

export function labelPapelSignatarioPadrao(papel: PapelSignatarioPadrao): string {
  return PAPEL_SIGNATARIO_PADRAO_LABELS[papel] ?? papel;
}

export const PAPEL_SIGNATARIO_PADRAO_OPCOES: Array<{
  valor: PapelSignatarioPadrao;
  label: string;
}> = (Object.keys(PAPEL_SIGNATARIO_PADRAO_LABELS) as PapelSignatarioPadrao[]).map((valor) => ({
  valor,
  label: PAPEL_SIGNATARIO_PADRAO_LABELS[valor],
}));
