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

// Recorte plano da análise de IA sobre um documento (RG/CNH, contrato
// social) pronto pra tela — ver paraAnaliseIaResumo em dossie.adapter.ts.
// `camposExtraidos` é mostrado como veio da IA (chave:valor bruto): os
// nomes de campo que o agente de análise usa pra RG/CNH não são
// documentados em lugar nenhum do projeto, então rotular como "RG"/
// "Órgão emissor" seria inventar uma correspondência não confirmada.
export interface AnaliseIaResumo {
  confiancaExtracao: number;
  alertas: string[];
  resumoAnalise: string | null;
  camposExtraidos: Record<string, unknown>;
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
