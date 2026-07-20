import type { StatusDocumento } from "@/modules/cadastro/domain/enums";

// Documento pronto pra tela de revisão — construído pelo adapter a
// partir do Documento real do banco (ver dossie.adapter.ts), consumido
// tanto pela page (que separa em ativos/pendentes) quanto pela View
// (RevisaoDocumentosComplementar, que só renderiza).
export interface DocumentoRevisao {
  id: string;
  label: string;
  gcsPath: string;
  status: StatusDocumento;
  motivoReprovacao: string | null;
}

// Linha da fila de assinatura do contrato (sócio da agência ou
// signatário fixo da Sakura) — ver montarFilaAssinatura em
// dossie.adapter.ts pra como `assinado` é derivado.
export interface SignatarioFila {
  id: string;
  nome: string;
  email: string | null;
  grupo: "Agência" | "Sakura";
  ordem: number;
  assinado: boolean;
  emailNaoEntregue: boolean;
}
