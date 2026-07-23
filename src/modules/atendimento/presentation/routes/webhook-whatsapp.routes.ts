import { createHmac, timingSafeEqual } from "crypto";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { webhookWhatsAppController } from "@/modules/atendimento/presentation/controllers/webhook-whatsapp.controller";
import { parseWebhookWhatsApp } from "@/modules/atendimento/infrastructure/webhooks/meta-whatsapp-webhook-parser";

// Handshake de verificação — a Meta chama com esses query params na
// primeira vez que o webhook é registrado (e sempre que reconfirma a URL).
// Precisa devolver o `challenge` cru, em texto puro — httpOk() envelopa em
// JSON, o que a Meta rejeita.
export function verificarWebhookWhatsAppRoute(request: Request): Response {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

function validarAssinaturaMeta(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;

  const esperado = `sha256=${createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")}`;
  const recebido = Buffer.from(header);
  const esperadoBuffer = Buffer.from(esperado);

  return recebido.length === esperadoBuffer.length && timingSafeEqual(recebido, esperadoBuffer);
}

export async function processarWebhookWhatsAppRoute(request: Request) {
  // Lido como texto primeiro (nunca .json() antes) — o HMAC precisa dos
  // bytes exatos do corpo, e qualquer reserialização quebra a assinatura.
  const rawBody = await request.text();

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    return httpError("WHATSAPP_APP_SECRET não configurada — webhook bloqueado.", 500);
  }

  const assinatura = request.headers.get("x-hub-signature-256");
  if (!validarAssinaturaMeta(rawBody, assinatura, appSecret)) {
    return httpError("Assinatura X-Hub-Signature-256 inválida.", 401);
  }

  const payload = JSON.parse(rawBody);
  const { mensagensRecebidas, statusAtualizados } = parseWebhookWhatsApp(payload);

  for (const mensagem of mensagensRecebidas) {
    if (mensagem.tipo === "nao_suportado") continue;

    await webhookWhatsAppController.processarInbound({
      telefoneWhatsapp: mensagem.deWaId,
      nomePerfil: mensagem.nomePerfil,
      tipo: mensagem.tipo,
      conteudo: mensagem.conteudoTexto ?? mensagem.midia?.mediaId ?? "",
      waMessageId: mensagem.waMessageId,
      mediaId: mensagem.midia?.mediaId,
      duracaoSegundos: mensagem.duracaoSegundos,
    });
  }

  for (const status of statusAtualizados) {
    await webhookWhatsAppController.atualizarStatus(status);
  }

  // Sempre 200 pra eventos reconhecidos — a Meta reenvia em retry se não
  // receber 2xx rápido, e não queremos reprocessar o que já tratamos.
  return httpOk({ recebidas: mensagensRecebidas.length, status: statusAtualizados.length });
}
