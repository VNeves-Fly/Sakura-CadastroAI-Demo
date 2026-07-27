import { createHmac, timingSafeEqual } from "crypto";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { webhookD4SignController } from "@/modules/cadastro/presentation/controllers/webhook-d4sign.controller";

// Campos usados: uuid (= Contrato.provedorId), type_post ("1" = documento
// finalizado, "2" = e-mail não entregue, "4" = assinatura individual),
// email (presente no "2" e "4") e message (presente no "2", motivo da
// falha). A doc oficial (docapi.d4sign.com.br/docs/webhook-postback)
// documenta form-data, e é o formato confirmado em teste manual — mas um
// evento real em produção chegou com um Content-Type que fez
// request.formData() lançar ERR_FORMDATA_PARSE_ERROR antes de qualquer
// lógica rodar (2026-07-27, incidente em prod). Em vez de assumir um
// único formato, decide pelo Content-Type recebido e nunca deixa o parse
// derrubar a rota com 500 — um erro nosso de parsing não some com retry
// (D4Sign reenvia por ~27h só ajuda pra falha transitória do lado deles).
export async function processarWebhookD4SignRoute(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const campos = contentType.includes("application/json")
    ? await extrairCamposJson(request)
    : await extrairCamposFormData(request);

  if (!campos) {
    console.error(`Webhook D4Sign: corpo não decodificável (content-type: "${contentType}").`);
    return httpError(`Payload de webhook não decodificável (content-type: "${contentType}").`, 422);
  }

  const { uuid, typePost, email, message } = campos;

  if (typeof uuid !== "string" || typeof typePost !== "string") {
    return httpError("Payload de webhook inválido — uuid e type_post são obrigatórios.", 422);
  }

  // Verificação de HMAC roda se D4SIGN_WEBHOOK_SECRET estiver configurada
  // ("Gerar Secret Key MAC" na área de API do D4Sign). Sem ela: em dev,
  // aceita sem validar a origem (documentado, não travar o webhook antes
  // da secret existir); em produção, falha fechado — não faz sentido
  // aceitar webhook sem autenticação num ambiente real.
  const secret = process.env.D4SIGN_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return httpError("D4SIGN_WEBHOOK_SECRET não configurada — webhook bloqueado.", 500);
    }
  } else {
    const assinaturaRecebida = request.headers.get("content-hmac");
    if (!validarAssinatura(uuid, secret, assinaturaRecebida)) {
      return httpError("Assinatura HMAC inválida.", 401);
    }
  }

  const resultado = await webhookD4SignController.processar({
    provedorId: uuid,
    typePost,
    ...(typeof email === "string" ? { email } : {}),
    ...(typeof message === "string" ? { message } : {}),
  });

  // Sempre 200: o D4Sign reenvia por até ~27h se não receber 2xx — não
  // queremos retry pra eventos que já reconhecemos e decidimos ignorar
  // (ex.: type_post de e-mail não entregue).
  return httpOk(resultado);
}

interface CamposWebhookD4Sign {
  uuid: unknown;
  typePost: unknown;
  email: unknown;
  message: unknown;
}

async function extrairCamposFormData(request: Request): Promise<CamposWebhookD4Sign | null> {
  const formData = await request.formData().catch(() => null);
  if (!formData) return null;

  return {
    uuid: formData.get("uuid"),
    typePost: formData.get("type_post"),
    email: formData.get("email"),
    message: formData.get("message"),
  };
}

async function extrairCamposJson(request: Request): Promise<CamposWebhookD4Sign | null> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return null;

  return {
    uuid: body.uuid,
    typePost: body.type_post,
    email: body.email,
    message: body.message,
  };
}

function validarAssinatura(documentUuid: string, secret: string, header: string | null): boolean {
  if (!header) return false;

  const esperado = `sha256=${createHmac("sha256", secret).update(documentUuid).digest("hex")}`;
  const recebido = Buffer.from(header);
  const esperadoBuffer = Buffer.from(esperado);

  return recebido.length === esperadoBuffer.length && timingSafeEqual(recebido, esperadoBuffer);
}
