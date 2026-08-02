import type { StatusDocumento } from "@/modules/cadastro/domain/enums";
import type { AnaliseIaComparacaoCampo } from "@/modules/cadastro/domain/services/document-analysis-service";
import type {
  AnaliseIaAmat,
  AnaliseIaRawToolCall,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type { SicaEmpresaStatus } from "@/modules/cadastro/domain/services/sst-service";

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
  camposExtras: Record<string, unknown>;
  textoBruto: string | null;
  formatoValido: boolean | null;
  camposObrigatoriosPresentes: boolean | null;
  referenciaCruzadaOk: boolean | null;
  detalhesChecagem: Record<string, unknown> | null;
  // Veredito da IA sobre esse documento específico (independente do parecer
  // final de agência, ver ParecerIaView) — null quando include_verdict não
  // foi pedido ou o documento é anterior a essa funcionalidade existir.
  parecer: string | null;
  // Comparação campo a campo com fonte oficial (Receita) — só populado pra
  // contrato_social hoje (ver docs/agency-analysis-params-tracking.md).
  comparacaoOficial: AnaliseIaComparacaoCampo[] | null;
}

// "O que o analista precisa checar", agrupado por documento (dentro de
// uma entidade — Agência ou um Sócio) — cada mensagem é um ponto
// concreto de divergência ou alerta de extração do cruzamento
// documental (stage3), nunca um resumo genérico.
export interface ParecerIaChecklistDocumento {
  tipoLabel: string;
  mensagens: string[];
}

// Uma entidade (Agência ou "Sócio N — Nome") com os documentos que têm
// pendência — entidades/documentos sem nenhuma mensagem não entram na
// lista (ver paraParecerView).
export interface ParecerIaChecklistGrupo {
  entidadeLabel: string;
  documentos: ParecerIaChecklistDocumento[];
}

// Consolidação do parecer da IA sobre a agência (ver
// AnaliseIaAgenciaDetalhe no domínio) pronta pra tela — uma seção só
// ("Parecer") reunindo veredito, motivo, pontos de alerta (flagsRisco)
// e o checklist derivado do cruzamento documental (stage3), pedido
// explicitamente pelo usuário em vez de espalhar essa informação em
// blocos separados. `resultado` classifica POR QUE a agência chegou no
// status atual (REPROVADO real vs FALHA_ANALISE/FALHA_CONTRATO técnicas
// vs EM_ANALISE ainda pendente — ver ResultadoAnaliseIa no domínio); é a
// fonte da verdade pro badge/rótulo, já que `parecer` (texto bruto do
// agente externo) fica null nos casos de falha técnica.
export interface ParecerIaView {
  resultado: string;
  parecer: string | null;
  motivo: string | null;
  pontosDeAlerta: string[];
  gruposParaChecar: ParecerIaChecklistGrupo[];
  avaliadoEm: Date;
}

// Linha da fila de assinatura do contrato (sócio da agência ou
// signatário fixo da Sakura) — ver montarFilaAssinatura em
// dossie.adapter.ts pra como `assinado` é derivado. `assinadoEm` é o
// registro real de ContratoAssinatura (webhook type_post=4 do D4Sign);
// null quando a assinatura só foi inferida do status agregado (contratos
// anteriores ao log existir ou fechados de uma vez pelo type_post=1).
export interface SignatarioFila {
  id: string;
  nome: string;
  email: string | null;
  grupo: "Agência" | "Sakura";
  ordem: number;
  assinado: boolean;
  assinadoEm: Date | null;
  emailNaoEntregue: boolean;
}

// AMAT/SOFIA reais (ver ConsultaAmatCard/ConsultaSofiaCard), lidos do
// stage2/raw_data persistidos em AnaliseIaAgencia (ver
// FlysakuraAnaliseIaAdapter, `verificar_amat`/`include_raw_data`) —
// substitui o mock front-end que existia antes (mock-amat-sofia.util.ts).
// `amat` já vem com schema tipado do agente (AnaliseIaAmat); `sofia`
// continua dict livre dos dois lados (sem contrato, ver AnaliseIaStage2) —
// exibido genericamente na UI. `rawAmat`/`rawSofia` são as chamadas de
// tool brutas (tool/args/output) que alimentam o "Ver tudo" de cada card,
// sempre presentes (arrays vazios) mesmo quando o stage2 tipado não achou
// nada — dão contexto de auditoria de qualquer forma.
// Uma linha de auditoria de reconsulta (ver HistoricoConsultaCreditoItem
// no domínio) — `fonte` não entra aqui: a lista já vem separada por card
// (historicoAmat/historicoSofia), então dentro de cada card ela é óbvia.
export interface HistoricoConsultaCreditoView {
  id: string;
  sucesso: boolean;
  erro: string | null;
  consultadoPor: string;
  consultadoEm: Date;
}

export interface AnaliseCreditoView {
  amat: AnaliseIaAmat | null;
  sofia: Record<string, unknown> | null;
  rawAmat: AnaliseIaRawToolCall[];
  rawSofia: AnaliseIaRawToolCall[];
  historicoAmat: HistoricoConsultaCreditoView[];
  historicoSofia: HistoricoConsultaCreditoView[];
}

// "Atual" = a consulta mais recente ao SST com sucesso=true (ver
// paraConsultaSicaView) — null quando nunca consultado, ou toda tentativa
// falhou tecnicamente. `metodo` distingue a checagem automática por CNPJ
// (ao finalizar o cadastro) da confirmação manual por código (ao salvar o
// SICA), pro dossiê dar contexto de como esse dado apareceu.
export interface ConsultaSicaAtualView {
  encontrado: boolean;
  empresaStatus: SicaEmpresaStatus | null;
  nomeEmpresa: string | null;
  codigoEmpresa: number | null;
  telefone: string | null;
  email: string | null;
  codigoExecutivo: number | null;
  nomeExecutivo: string | null;
  metodo: "cnpj" | "codigo_empresa";
  consultadoEm: Date;
}

export interface ConsultaSicaView {
  atual: ConsultaSicaAtualView | null;
  historico: HistoricoConsultaCreditoView[];
}
