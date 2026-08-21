import { createHmac, timingSafeEqual } from "crypto";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { webhookLegitimuzController } from "@/modules/cadastro/presentation/controllers/webhook-legitimuz.controller";

// Dois formatos de payload documentados (doc colada pelo usuário, ClickUp,
// 2026-08-21 — nunca testado ao vivo contra a conta real):
// - Evento inicial: `{ status, ref_id, personId, integration }`.
// - Atualização de revisão manual (`type: "update"`, quando alguém no
//   dashboard da Legitimuz resolve um caso "Análise Manual"): o status de
//   verdade fica em `validationPerson.meta.status`/`.ref_id`, não na raiz.
interface CamposWebhookLegitimuz {
  refId: unknown;
  status: unknown;
}

function extrairCampos(body: Record<string, unknown>): CamposWebhookLegitimuz {
  if (body.type === "update") {
    const validationPerson = body.validationPerson as Record<string, unknown> | undefined;
    const meta = validationPerson?.meta as Record<string, unknown> | undefined;
    return { refId: meta?.ref_id, status: meta?.status };
  }

  return { refId: body.ref_id, status: body.status };
}

// Assinatura documentada como `X-Signature: sha256=<hmac>`, calculada
// sobre `JSON.stringify(payload)` do lado da Legitimuz (mesmo snippet que
// eles fornecem pra gerar) — por isso o corpo é lido como texto primeiro
// (nunca .json() antes de validar), mesma lição já aplicada no webhook do
// WhatsApp: reserializar quebraria a assinatura se a ordem das chaves não
// bater byte a byte.
function validarAssinatura(rawBody: string, secret: string, header: string | null): boolean {
  if (!header) return false;

  const calculado = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const recebido = header.startsWith("sha256=") ? header.slice("sha256=".length) : header;

  const recebidoBuffer = Buffer.from(recebido);
  const calculadoBuffer = Buffer.from(calculado);

  return (
    recebidoBuffer.length === calculadoBuffer.length &&
    timingSafeEqual(recebidoBuffer, calculadoBuffer)
  );
}

export async function processarWebhookLegitimuzRoute(request: Request) {
  const rawBody = await request.text();
  const body = JSON.parse(rawBody || "{}") as Record<string, unknown> | null;

  if (!body || typeof body !== "object") {
    console.error("Webhook Legitimuz: corpo não decodificável.");
    return httpError("Payload de webhook inválido.", 422);
  }

  // Mesma postura do webhook D4Sign: sem secret configurada, bloqueia em
  // produção e deixa passar em dev (documentado, não trava o webhook antes
  // da secret existir).
  const secret = process.env.LEGITIMUZ_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("LEGITIMUZ_WEBHOOK_SECRET não configurada — webhook bloqueado.");
      return httpError("LEGITIMUZ_WEBHOOK_SECRET não configurada — webhook bloqueado.", 500);
    }
  } else {
    const signature = request.headers.get("x-signature");
    if (!validarAssinatura(rawBody, secret, signature)) {
      console.error(
        `Webhook Legitimuz: assinatura inválida (header ${signature ? "presente mas não bateu" : "ausente"}).`,
      );
      return httpError("Assinatura inválida.", 401);
    }
  }

  const { refId, status } = extrairCampos(body);
  if (typeof refId !== "string" || !refId || typeof status !== "string" || !status) {
    console.error(
      `Webhook Legitimuz: ref_id/status inválidos — ref_id=${JSON.stringify(refId)}, status=${JSON.stringify(status)}.`,
    );
    return httpError("Payload de webhook inválido — ref_id e status são obrigatórios.", 422);
  }

  const resultado = await webhookLegitimuzController.processar({ refId, status });

  // Sempre 200 pra payload reconhecido — evita retry indefinido pro que já
  // decidimos ignorar (status não reconhecido, verificação não encontrada).
  return httpOk(resultado);
}
