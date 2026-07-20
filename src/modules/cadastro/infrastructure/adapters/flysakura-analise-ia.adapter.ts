import { Storage } from "@google-cloud/storage";
import type {
  AnaliseIaInput,
  AnaliseIaResultado,
  AnaliseIaService,
} from "@/modules/cadastro/domain/services/analise-ia-service";

// Integração real com o agente de análise da Sakura
// (https://agents.flysakura.com/redoc). Usa o endpoint
// POST /api/v1/agency-analysis/json em vez do POST /api/v1/agency-analysis/
// "genérico" porque só o /json força channel="api" e garante resposta
// tipada (parecer/justificativa/flags_risco) — o endpoint genérico responde
// no formato de chat (webchat por default), que não dá pra mapear pra
// aprovado/motivo com confiança.
//
// Pendências pra ativar (troca de MockAnaliseIaService por esta classe em
// cadastro-publico.controller.ts — só isso, o use-case já manda os dados
// certos):
// 1. AGENCY_ANALYSIS_API_KEY no .env — valor do header X-Internal-Secret
//    (esquema "InternalSecret" no OpenAPI). Sem ela, toda chamada falha.
// 2. Os documentos (contrato social, RG, procuração) precisam estar no GCS
//    — este adapter gera URLs assinadas (válidas por 15 min) a partir de
//    GCS_BUCKET_NAME/GCS_FOLDER_PREFIX pra mandar em `documents`/
//    `partners[].attachments`. Se o storage ativo for o LocalFileStorage
//    (disco local), a análise real não tem como buscar esses arquivos.
// Lida a cada chamada (não como const de módulo) pra não travar o valor
// no primeiro import — importa pra troca de ambiente em teste.
function baseUrl(): string {
  return process.env.AGENCY_ANALYSIS_BASE_URL ?? "https://agents.flysakura.com";
}
const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

const storage = new Storage();

export class FlysakuraAnaliseIaAdapter implements AnaliseIaService {
  async avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado> {
    const [contratoSocialUrl, socios] = await Promise.all([
      this.assinarUrl(input.contratoSocialPath),
      Promise.all(
        input.socios.map(async (socio) => ({
          name: socio.nome,
          document: socio.cpf,
          attachments: await Promise.all(
            [socio.rgPath, socio.procuracaoPath]
              .filter((path): path is string => path !== null)
              .map((path) => this.assinarUrl(path)),
          ),
        })),
      ),
    ]);

    const response = await fetch(`${baseUrl()}/api/v1/agency-analysis/json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": requireApiKey(),
      },
      body: JSON.stringify({
        cnpj: input.cnpj,
        company_name: input.razaoSocial,
        partners: socios,
        documents: [contratoSocialUrl],
        analysis_data: { cnpj: input.cnpj, focus: "completo" },
        include_receita_data: false,
        raw: false,
        // Mesmo valor usado pelo FlysakuraDocumentAnalysisAdapter — os dois
        // endpoints compartilham o checkpoint do LangGraph por session_id,
        // então essa análise final já enxerga o contexto de cada documento
        // analisado individualmente antes (contrato social, RG dos sócios).
        session_id: input.cnpj,
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

  private async assinarUrl(objectPath: string): Promise<string> {
    const [url] = await storage
      .bucket(requireBucketName())
      .file(objectPath)
      .getSignedUrl({ action: "read", expires: Date.now() + SIGNED_URL_TTL_MS });
    return url;
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
      "GCS_BUCKET_NAME não configurada — necessária para assinar URLs dos documentos.",
    );
  }
  return bucketName;
}
