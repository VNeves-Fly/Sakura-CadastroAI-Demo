import type {
  AnaliseIaAmat,
  AnaliseIaAmatPendencias,
  AnaliseIaAmatPendenciaItem,
  AnaliseIaCnaePrincipal,
  AnaliseIaDetalhamento,
  AnaliseIaDocumentoDetalhe,
  AnaliseIaInput,
  AnaliseIaRawData,
  AnaliseIaResultado,
  AnaliseIaService,
  AnaliseIaStage1,
  AnaliseIaStage2,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import {
  flysakuraBaseUrl,
  requireFlysakuraApiKey,
} from "@/modules/cadastro/infrastructure/adapters/flysakura-http.util";
import { sanitizarUnicodeParaJsonb } from "@/modules/shared/utils/sanitizar-unicode-jsonb.util";

// Integração real com o agente de análise da Sakura
// (https://agents.flysakura.com/redoc) — POST /api/v1/agency-analysis/sync
// (renomeado de /agency-analysis/json na padronização sync/async/stream do
// agents-service — mesmo body, mesma resposta tipada, só o path mudou).
// Todos os dados de negócio vão dentro de `analysis_data` — o nível raiz do
// body só carrega cnpj/channel/language/session_id e flags que controlam a
// resposta como um todo (ex.: `include_raw_data`, confirmado em
// AgencyAnalysisRequest do /openapi.json deles — não é um campo de
// `analysis_data`).
//
// Decisão (2026-07-20, debatida com o usuário): em vez de mandar só a
// referência do arquivo e deixar a etapa 4 reprocessar do zero (o que batia
// em "agent_execution_failed"), cada documento em
// `analysis_data.socios[].documentos` já leva o resultado que
// documentAnalysisService.analisar() (etapa 3, /documents/analyze/sync) já
// calculou — campos extraídos, confiança e alertas — pra etapa 4 só cruzar
// dado em vez de reanalisar. `razao_social`/`email`/`cnpj` continuam vindo
// da fonte "de verdade" (QSA/formulário), não do OCR do contrato social —
// contrato social não entra em `documentos`, só alimenta esses campos.
//
// `analysis_data.documentos` (nível empresa: cadastur/iata/comprovante de
// endereço da agência) e `socios[].documentos` com comprovante de endereço
// do sócio ficam de fora — são documentos que o wizard atual não coleta
// (roadmap). Procuração também não entra ainda: documentAnalysisService só
// analisa contrato_social e doc_identificacao hoje; quando "procuracao" for
// um document_type suportado lá, o resultado entra em socios[].documentos
// do mesmo jeito que o de doc_identificacao.
export class FlysakuraAnaliseIaAdapter implements AnaliseIaService {
  async avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado> {
    const socios = input.socios.map((socio) => ({
      nome: socio.nome,
      documento_identificacao: socio.cpf,
      data_nascimento: socio.dataNascimento,
      documentos: [
        {
          // "doc_identificacao" é um DocumentType de primeira classe no
          // schema deles — pensado exatamente pra esse caso, onde o wizard
          // não distingue RG de CNH no upload (mesmo slot) e o agente
          // classifica sozinho via `campos_extraidos.tipo_documento_identificado`.
          // Sem `internal_document_url`: essa etapa não reprocessa o
          // arquivo, só cruza os campos que a etapa 3 já extraiu.
          document_type: "doc_identificacao",
          campos_extraidos: socio.rgAnalise.camposExtraidos,
          confidence_score: socio.rgAnalise.confiancaExtracao,
          alertas: socio.rgAnalise.alertas,
        },
      ],
    }));

    const body = JSON.stringify({
      cnpj: input.cnpj,
      channel: "api",
      language: "pt-br",
      session_id: input.cnpj,
      // Traz o payload bruto de cada tool chamada (search_amat_debts,
      // sofia_agency_lookup etc.), antes de qualquer sumarização —
      // exposto ao analista no dossiê como complemento ao stage2
      // resumido (ver AnaliseIaRawData). Campo raiz do request, não de
      // `analysis_data` (confirmado no /openapi.json deles).
      include_raw_data: true,
      analysis_data: {
        cnpj: input.cnpj,
        focus: "completo",
        verificar_processos: false,
        // Ligado (2026-07-27): decisão do usuário de trazer dívida
        // AMAT de verdade pro dossiê em vez do mock front-end (ver
        // mock-amat-sofia.util.ts, que este trabalho substitui). Os CPFs
        // dos sócios já vão em `socios[].documento_identificacao` — o
        // agente usa isso pra decidir quem consultar no AMAT; não existe
        // `amat_cpfs_socios` no schema deles (confirmado pelo usuário).
        verificar_amat: true,
        razao_social: input.razaoSocial,
        email: input.email,
        socios,
        // Documentos de nível empresa (cadastur/iata) ficam de fora
        // enquanto o array estiver vazio — o wizard não coleta esses
        // documentos ainda. Reaparece aqui quando houver item real.
      },
    });
    const response = await fetch(`${flysakuraBaseUrl()}/api/v1/agency-analysis/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": requireFlysakuraApiKey(),
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`agency-analysis respondeu ${response.status}: ${await response.text()}`);
    }

    // Saneado antes de qualquer mapeamento: stage1/stage2/stage3/raw_data vêm
    // de fontes externas (AMAT/SOFIA, via agents.flysakura.com) que já
    // quebraram o upsert em produção com "22P05 unsupported Unicode escape
    // sequence" — NUL/surrogate solto em algum campo de texto, algo que o
    // tipo jsonb do Postgres não aceita mesmo sendo JSON válido.
    const resultado = sanitizarUnicodeParaJsonb(
      (await response.json()) as {
        parecer: "APROVADO" | "PENDENTE" | "REPROVADO" | null;
        justificativa: string;
        flags_risco: string[];
        // Razões estruturadas (enum) por trás do parecer — ex.:
        // AMAT_DIVIDA, DOCUMENTO_VENCIDO, CNPJ_INATIVO. Adicionado
        // 2026-08-05 junto da mudança do agents-service que parou de
        // reprovar automaticamente por dívida AMAT/SOFIA (o parecer final
        // passou a ser 100% do LLM, `razoes` é o motivo estruturado).
        // Ausente em respostas de versões anteriores do agents-service.
        razoes?: string[];
        stage1?: RawStage1 | null;
        stage2?: RawStage2 | null;
        stage3?: {
          documentos_empresa?: RawDocumentoDetalhe[];
          socios?: RawSocioDetalhe[];
        };
        raw_data?: AnaliseIaRawData | null;
      },
    );

    return {
      aprovado: resultado.parecer === "APROVADO",
      motivo: resultado.parecer === "APROVADO" ? null : resultado.justificativa || null,
      parecer: resultado.parecer ?? undefined,
      flagsRisco: resultado.flags_risco,
      razoes: resultado.razoes ?? [],
      detalhamento: resultado.stage3 ? mapDetalhamento(resultado.stage3) : null,
      stage1: resultado.stage1 ? mapStage1(resultado.stage1) : null,
      stage2: resultado.stage2 ? mapStage2(resultado.stage2) : null,
      rawData: resultado.raw_data ?? null,
    };
  }
}

interface RawCampoComparado {
  fornecido: string | null;
  oficial: string | null;
  confere: boolean | null;
}

interface RawCnae {
  codigo: string | null;
  description: string | null;
  compativel_turismo: boolean | null;
}

interface RawStage1 {
  executed?: boolean;
  situacao_cadastral: string | null;
  cnae_principal: RawCnae | null;
  cnaes_secundarios?: RawCnae[] | null;
  razao_social: RawCampoComparado | null;
  nome_fantasia: RawCampoComparado | null;
  email?: {
    fornecido: string | null;
    has_mx: boolean;
    corporativo: boolean;
  } | null;
  socios: {
    fornecidos: Array<Record<string, unknown>>;
    oficiais: Array<Record<string, unknown>>;
    divergencias: string[];
  } | null;
  processos?: {
    verificado: boolean;
    resumo: string | null;
  } | null;
}

function mapCnae(raw: RawCnae): AnaliseIaCnaePrincipal {
  return {
    codigo: raw.codigo,
    descricao: raw.description,
    compativelTurismo: raw.compativel_turismo,
  };
}

function mapStage1(raw: RawStage1): AnaliseIaStage1 {
  return {
    situacaoCadastral: raw.situacao_cadastral,
    cnaePrincipal: raw.cnae_principal ? mapCnae(raw.cnae_principal) : null,
    cnaesSecundarios: (raw.cnaes_secundarios ?? []).map(mapCnae),
    razaoSocial: raw.razao_social,
    nomeFantasia: raw.nome_fantasia,
    email: raw.email
      ? {
          fornecido: raw.email.fornecido,
          hasMx: raw.email.has_mx,
          corporativo: raw.email.corporativo,
        }
      : null,
    socios: raw.socios
      ? {
          fornecidos: raw.socios.fornecidos,
          oficiais: raw.socios.oficiais,
          divergencias: raw.socios.divergencias,
        }
      : null,
    processos: raw.processos
      ? { verificado: raw.processos.verificado, resumo: raw.processos.resumo }
      : null,
  };
}

interface RawAmatPendenciaItem {
  qtde?: number;
  total?: number;
  itens?: Record<string, unknown>[];
}

interface RawAmatPendencias {
  pefin?: RawAmatPendenciaItem;
  refin?: RawAmatPendenciaItem;
  protestos?: RawAmatPendenciaItem;
  cheques_sem_fundo?: RawAmatPendenciaItem;
  dividas_vencidas?: RawAmatPendenciaItem;
  total_pendencias?: number;
}

interface RawAmatSocioRestricao {
  nome: string;
  cpf: string;
  perc_participacao: number | null;
  cargo: string | null;
  pendencias?: RawAmatPendencias;
}

interface RawAmat {
  consultado?: boolean;
  ultima_consulta: string | null;
  empresa: RawAmatPendencias | null;
  socios_com_restricao?: RawAmatSocioRestricao[];
  total_geral?: number;
}

interface RawStage2 {
  sofia: Record<string, unknown> | null;
  processos_judiciais: Record<string, unknown> | null;
  reclamacoes: Record<string, unknown> | null;
  amat: RawAmat | null;
  debt_total: number | null;
}

function mapAmatPendenciaItem(raw: RawAmatPendenciaItem | undefined): AnaliseIaAmatPendenciaItem {
  return { qtde: raw?.qtde ?? 0, total: raw?.total ?? 0, itens: raw?.itens ?? [] };
}

function mapAmatPendencias(raw: RawAmatPendencias | null | undefined): AnaliseIaAmatPendencias {
  return {
    pefin: mapAmatPendenciaItem(raw?.pefin),
    refin: mapAmatPendenciaItem(raw?.refin),
    protestos: mapAmatPendenciaItem(raw?.protestos),
    chequesSemFundo: mapAmatPendenciaItem(raw?.cheques_sem_fundo),
    dividasVencidas: mapAmatPendenciaItem(raw?.dividas_vencidas),
    totalPendencias: raw?.total_pendencias ?? 0,
  };
}

function mapAmat(raw: RawAmat): AnaliseIaAmat {
  return {
    consultado: raw.consultado ?? false,
    ultimaConsulta: raw.ultima_consulta,
    empresa: raw.empresa ? mapAmatPendencias(raw.empresa) : null,
    sociosComRestricao: (raw.socios_com_restricao ?? []).map((socio) => ({
      nome: socio.nome,
      cpf: socio.cpf,
      percParticipacao: socio.perc_participacao,
      cargo: socio.cargo,
      pendencias: mapAmatPendencias(socio.pendencias),
    })),
    totalGeral: raw.total_geral ?? 0,
  };
}

function mapStage2(raw: RawStage2): AnaliseIaStage2 {
  return {
    amat: raw.amat ? mapAmat(raw.amat) : null,
    sofia: raw.sofia,
    processosJudiciais: raw.processos_judiciais,
    reclamacoes: raw.reclamacoes,
    debtTotal: raw.debt_total,
  };
}

interface RawComparacaoCampo {
  campo: string;
  extraido: string | null;
  oficial: string | null;
  fornecido: string | null;
  confere: boolean;
}

interface RawDocumentoDetalhe {
  tipo: string;
  campos: RawComparacaoCampo[];
  alertas_extracao: string[];
  valido: boolean;
}

interface RawSocioDetalhe {
  nome: string;
  documentos: RawDocumentoDetalhe[];
}

function mapDocumentoDetalhe(raw: RawDocumentoDetalhe): AnaliseIaDocumentoDetalhe {
  return {
    tipo: raw.tipo,
    campos: raw.campos,
    alertasExtracao: raw.alertas_extracao,
    valido: raw.valido,
  };
}

function mapDetalhamento(stage3: {
  documentos_empresa?: RawDocumentoDetalhe[];
  socios?: RawSocioDetalhe[];
}): AnaliseIaDetalhamento {
  return {
    documentosEmpresa: (stage3.documentos_empresa ?? []).map(mapDocumentoDetalhe),
    socios: (stage3.socios ?? []).map((socio) => ({
      nome: socio.nome,
      documentos: socio.documentos.map(mapDocumentoDetalhe),
    })),
  };
}
