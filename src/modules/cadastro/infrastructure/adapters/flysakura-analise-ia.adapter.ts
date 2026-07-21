import type {
  AnaliseIaDetalhamento,
  AnaliseIaDocumentoDetalhe,
  AnaliseIaInput,
  AnaliseIaResultado,
  AnaliseIaService,
} from "@/modules/cadastro/domain/services/analise-ia-service";

// Integração real com o agente de análise da Sakura
// (https://agents.flysakura.com/redoc) — POST /api/v1/agency-analysis/sync
// (renomeado de /agency-analysis/json na padronização sync/async/stream do
// agents-service — mesmo body, mesma resposta tipada, só o path mudou).
// Todos os dados de negócio vão dentro de `analysis_data` — não no nível
// raiz do body, que só carrega cnpj/channel/language/session_id.
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
function baseUrl(): string {
  return process.env.AGENCY_ANALYSIS_BASE_URL ?? "https://agents.flysakura.com";
}

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

    const response = await fetch(`${baseUrl()}/api/v1/agency-analysis/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": requireApiKey(),
      },
      body: JSON.stringify({
        cnpj: input.cnpj,
        channel: "api",
        language: "pt-br",
        session_id: input.cnpj,
        analysis_data: {
          cnpj: input.cnpj,
          focus: "completo",
          verificar_processos: false,
          verificar_amat: false,
          razao_social: input.razaoSocial,
          email: input.email,
          socios,
          // Documentos de nível empresa (cadastur/iata) ficam de fora
          // enquanto o array estiver vazio — o wizard não coleta esses
          // documentos ainda. Reaparece aqui quando houver item real.
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`agency-analysis respondeu ${response.status}: ${await response.text()}`);
    }

    const resultado = (await response.json()) as {
      parecer: "APROVADO" | "PENDENTE" | "REPROVADO" | null;
      justificativa: string;
      flags_risco: string[];
      stage3?: {
        documentos_empresa?: RawDocumentoDetalhe[];
        socios?: RawSocioDetalhe[];
      };
    };

    return {
      aprovado: resultado.parecer === "APROVADO",
      motivo: resultado.parecer === "APROVADO" ? null : resultado.justificativa || null,
      parecer: resultado.parecer ?? undefined,
      flagsRisco: resultado.flags_risco,
      detalhamento: resultado.stage3 ? mapDetalhamento(resultado.stage3) : null,
    };
  }
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

function requireApiKey(): string {
  const apiKey = process.env.AGENCY_ANALYSIS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AGENCY_ANALYSIS_API_KEY não configurada — necessária para FlysakuraAnaliseIaAdapter.",
    );
  }
  return apiKey;
}
