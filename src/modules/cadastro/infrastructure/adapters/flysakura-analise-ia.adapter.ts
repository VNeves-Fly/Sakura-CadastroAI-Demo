import type {
  AnaliseIaInput,
  AnaliseIaResultado,
  AnaliseIaService,
} from "@/modules/cadastro/domain/services/analise-ia-service";

// Integração real com o agente de análise da Sakura
// (https://agents.flysakura.com/redoc) — POST /api/v1/agency-analysis/json.
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
// analisa contrato_social e cnh_rg hoje; quando "procuracao" for um
// document_type suportado lá, o resultado entra em socios[].documentos do
// mesmo jeito que o de cnh_rg.
function baseUrl(): string {
  return process.env.AGENCY_ANALYSIS_BASE_URL ?? "https://agents.flysakura.com";
}

function documentoInterno(documentPath: string, documentType: string) {
  return {
    document_url: "",
    internal_document_url: `gs://${requireBucketName()}/${documentPath}`,
    document_type: documentType,
  };
}

export class FlysakuraAnaliseIaAdapter implements AnaliseIaService {
  async avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado> {
    const socios = input.socios.map((socio) => ({
      nome: socio.nome,
      documento_identificacao: socio.cpf,
      documentos: [
        {
          // "doc_identificacao" (não "cnh_rg", vocabulário da etapa 3) —
          // testando contra a API real, document_type aqui só aceita
          // 'cnh' | 'rg' | 'doc_identificacao' | 'rne' | 'rnm' | 'iata' |
          // 'cadastur' | 'comprovante_endereco' | 'certidao_casamento'. O
          // wizard não distingue se o sócio enviou RG ou CNH (mesmo slot de
          // upload), então usamos o valor genérico em vez de arriscar.
          ...documentoInterno(socio.rgPath, "doc_identificacao"),
          campos_extraidos: socio.rgAnalise.camposExtraidos,
          confidence_score: socio.rgAnalise.confiancaExtracao,
          alertas: socio.rgAnalise.alertas,
        },
      ],
    }));

    const response = await fetch(`${baseUrl()}/api/v1/agency-analysis/json`, {
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
          retornar_tabela: false,
          verificar_processos: false,
          verificar_amat: false,
          razao_social: input.razaoSocial,
          email: input.email,
          socios,
          documentos: [],
          amat_cpfs_socios: [],
          amat_adicionais: [],
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
    };

    return {
      aprovado: resultado.parecer === "APROVADO",
      motivo: resultado.parecer === "APROVADO" ? null : resultado.justificativa || null,
      parecer: resultado.parecer ?? undefined,
      flagsRisco: resultado.flags_risco,
    };
  }
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

function requireBucketName(): string {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error(
      "GCS_BUCKET_NAME não configurada — necessária para montar internal_document_url.",
    );
  }
  return bucketName;
}
