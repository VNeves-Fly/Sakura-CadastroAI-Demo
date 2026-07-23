import { RateLimitError } from "@/modules/shared/domain/errors";
import { ForaDaJanela24hError } from "@/modules/atendimento/domain/errors";
import type {
  EnviarMidiaInput,
  EnvioResultado,
  TemplateAprovadoMeta,
  TipoMidiaWhatsApp,
  WhatsAppMessagingService,
} from "@/modules/atendimento/domain/services/whatsapp-messaging-service";

// Integração real com a Meta WhatsApp Business Cloud API
// (https://developers.facebook.com/docs/whatsapp/cloud-api/). Autenticação
// via header Bearer (diferente do D4Sign, que usa query string) — mesmo
// padrão do ReceitaWS.
function baseUrl(): string {
  return process.env.WHATSAPP_API_BASE_URL ?? "https://graph.facebook.com/v21.0";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não configurada — necessária para MetaWhatsAppAdapter.`);
  }
  return value;
}

// Espelha o campo `type` que a Meta espera pra mensagem de mídia — chave
// distinta do nosso `TipoMidiaWhatsApp` porque "pdf" (nosso) é "document"
// (deles).
const META_TYPE_POR_TIPO: Record<TipoMidiaWhatsApp, string> = {
  audio: "audio",
  imagem: "image",
  pdf: "document",
};

interface MetaMensagemErro {
  error?: { code?: number; message?: string };
}

interface MetaEnvioResposta {
  messages?: { id: string }[];
}

interface MetaTemplateComponente {
  type: string;
  text?: string;
}

interface MetaTemplateItem {
  id: string;
  name: string;
  language: string;
  status: string;
  components: MetaTemplateComponente[];
}

interface MetaTemplatesResposta {
  data: MetaTemplateItem[];
  paging?: { next?: string };
}

function flattenBody(components: MetaTemplateComponente[]): string {
  const body = components.find((componente) => componente.type === "BODY");
  return body?.text ?? "";
}

// Remove só formatação (+, espaços, parênteses, traços) — nunca adivinha
// ou prefixa DDI. Quem monta o número (contact matcher / repositório) já
// garante que vem com o "55" na frente.
function normalizarNumeroParaMeta(numero: string): string {
  return numero.replace(/\D/g, "");
}

export class MetaWhatsAppAdapter implements WhatsAppMessagingService {
  async enviarTexto(paraNumero: string, texto: string): Promise<EnvioResultado> {
    const resultado = (await this.requestPhoneNumber("POST", "/messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizarNumeroParaMeta(paraNumero),
      type: "text",
      text: { preview_url: false, body: texto },
    })) as MetaEnvioResposta;

    return { waMessageId: this.extrairMessageId(resultado) };
  }

  async enviarTemplate(
    paraNumero: string,
    templateNome: string,
    idioma: string,
    parametros?: string[],
  ): Promise<EnvioResultado> {
    const resultado = (await this.requestPhoneNumber("POST", "/messages", {
      messaging_product: "whatsapp",
      to: normalizarNumeroParaMeta(paraNumero),
      type: "template",
      template: {
        name: templateNome,
        language: { code: idioma },
        ...(parametros && parametros.length > 0
          ? {
              components: [
                {
                  type: "body",
                  parameters: parametros.map((texto) => ({ type: "text", text: texto })),
                },
              ],
            }
          : {}),
      },
    })) as MetaEnvioResposta;

    return { waMessageId: this.extrairMessageId(resultado) };
  }

  async enviarMidia(
    paraNumero: string,
    tipo: TipoMidiaWhatsApp,
    arquivo: EnviarMidiaInput,
  ): Promise<EnvioResultado> {
    const mediaId = await this.uploadMidia(arquivo);
    const metaType = META_TYPE_POR_TIPO[tipo];

    const resultado = (await this.requestPhoneNumber("POST", "/messages", {
      messaging_product: "whatsapp",
      to: normalizarNumeroParaMeta(paraNumero),
      type: metaType,
      [metaType]: tipo === "pdf" ? { id: mediaId, filename: arquivo.filename } : { id: mediaId },
    })) as MetaEnvioResposta;

    return { waMessageId: this.extrairMessageId(resultado) };
  }

  async listarTemplatesAprovados(): Promise<TemplateAprovadoMeta[]> {
    const wabaId = requireEnv("WHATSAPP_BUSINESS_ACCOUNT_ID");
    const templates: TemplateAprovadoMeta[] = [];
    let url: string | null = `${baseUrl()}/${wabaId}/message_templates?status=APPROVED`;

    while (url) {
      const resposta = (await this.requestAbsolute("GET", url)) as MetaTemplatesResposta;

      for (const item of resposta.data) {
        if (item.status !== "APPROVED") continue;
        templates.push({
          metaTemplateId: item.id,
          nome: item.name,
          idioma: item.language,
          conteudo: flattenBody(item.components),
        });
      }

      url = resposta.paging?.next ?? null;
    }

    return templates;
  }

  async baixarMidia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const metaResposta = await fetch(`${baseUrl()}/${mediaId}`, {
      headers: { Authorization: `Bearer ${requireEnv("WHATSAPP_ACCESS_TOKEN")}` },
    });
    if (!metaResposta.ok) {
      throw new Error(`Meta media lookup ${mediaId} respondeu ${metaResposta.status}`);
    }
    const { url, mime_type: mimeType } = (await metaResposta.json()) as {
      url: string;
      mime_type: string;
    };

    const arquivoResposta = await fetch(url, {
      headers: { Authorization: `Bearer ${requireEnv("WHATSAPP_ACCESS_TOKEN")}` },
    });
    if (!arquivoResposta.ok) {
      throw new Error(`Meta media CDN ${mediaId} respondeu ${arquivoResposta.status}`);
    }

    const buffer = Buffer.from(await arquivoResposta.arrayBuffer());
    return { buffer, mimeType: mimeType.split(";")[0] ?? mimeType };
  }

  private async uploadMidia(arquivo: EnviarMidiaInput): Promise<string> {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append(
      "file",
      new Blob([new Uint8Array(arquivo.buffer)], { type: arquivo.mimeType }),
      arquivo.filename ?? "arquivo",
    );

    const response = await fetch(`${baseUrl()}/${requireEnv("WHATSAPP_PHONE_NUMBER_ID")}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${requireEnv("WHATSAPP_ACCESS_TOKEN")}` },
      body: form,
    });

    const resultado = (await response.json().catch(() => null)) as { id?: string } | null;
    if (!response.ok || !resultado?.id) {
      throw new Error(
        `Meta media upload respondeu ${response.status}: ${JSON.stringify(resultado)}`,
      );
    }
    return resultado.id;
  }

  private extrairMessageId(resultado: MetaEnvioResposta): string {
    const id = resultado.messages?.[0]?.id;
    if (!id) throw new Error("Resposta da Meta sem messages[0].id.");
    return id;
  }

  private requestPhoneNumber(method: string, path: string, body?: unknown): Promise<unknown> {
    const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
    return this.requestAbsolute(method, `${baseUrl()}/${phoneNumberId}${path}`, body);
  }

  private async requestAbsolute(method: string, url: string, body?: unknown): Promise<unknown> {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${requireEnv("WHATSAPP_ACCESS_TOKEN")}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const resultado = await response.json().catch(() => null);
    if (!response.ok) {
      const erro = (resultado as MetaMensagemErro)?.error;
      if (erro?.code === 131047) throw new ForaDaJanela24hError();
      if (erro?.code === 131056 || erro?.code === 130429) {
        throw new RateLimitError(
          "Limite de envio do WhatsApp atingido. Aguarde antes de tentar de novo.",
        );
      }
      throw new Error(
        `WhatsApp Cloud API ${url} respondeu ${response.status}: ${JSON.stringify(resultado)}`,
      );
    }
    return resultado;
  }
}
