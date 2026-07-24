import type { StatusDocumento } from "@/modules/cadastro/domain/enums";

// Versão antiga (já substituída) de um documento — reprovada ou não,
// preservada só pra auditoria/histórico. Nunca é "a atual" do slot (ver
// historicoDoSlot em dossie.adapter.ts).
export interface DocumentoHistoricoItem {
  id: string;
  status: StatusDocumento;
  motivoReprovacao: string | null;
  reprovadoPor: string | null;
  reprovadoEm: Date | null;
  createdAt: Date;
  gcsPath: string;
}

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
  historico: DocumentoHistoricoItem[];
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

// Um item do "o que o analista precisa checar" — sempre um ponto
// concreto de divergência ou alerta de extração encontrado no
// cruzamento documental (stage3), nunca um resumo genérico. `origem` é
// o rótulo de onde veio (tipo do documento da empresa, como retornado
// pela IA, ou nome do sócio).
export interface ParecerIaItemChecklist {
  origem: string;
  mensagem: string;
}

// Consolidação do parecer da IA sobre a agência (ver
// AnaliseIaAgenciaDetalhe no domínio) pronta pra tela — uma seção só
// ("Parecer") reunindo veredito, motivo, pontos de alerta (flagsRisco)
// e o checklist derivado do cruzamento documental (stage3), pedido
// explicitamente pelo usuário em vez de espalhar essa informação em
// blocos separados.
export interface ParecerIaView {
  parecer: string | null;
  motivo: string | null;
  pontosDeAlerta: string[];
  itensParaChecar: ParecerIaItemChecklist[];
  avaliadoEm: Date;
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
