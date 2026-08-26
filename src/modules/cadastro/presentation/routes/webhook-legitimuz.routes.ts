import { createHmac, timingSafeEqual } from "crypto";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { webhookLegitimuzController } from "@/modules/cadastro/presentation/controllers/webhook-legitimuz.controller";

// Formatos de payload confirmados até agora (o flow kyc-faceindex manda
// MAIS DE UM evento por sessão — não é um payload único):
// - Atualização de revisão manual (`type: "update"`, quando alguém no
//   dashboard da Legitimuz resolve um caso "Análise Manual"): o status de
//   verdade fica em `validationPerson.meta.status`/`.ref_id`, não na raiz
//   (doc do ClickUp, nunca testado ao vivo).
// - Evento genérico documentado: `{ status, ref_id, personId, integration }`
//   na raiz (idem, nunca testado ao vivo).
// - Evento de liveness/facematch, confirmado ao vivo 2026-08-26 (a doc
//   estava errada pra esse caso): NÃO tem `status` na raiz — o resultado
//   vem em `liveness.status`/`facematch.status` (`ref_id` esse sim já vem
//   na raiz).
// - Evento de OCR de documento (`ocr.status`), TAMBÉM confirmado ao vivo
//   2026-08-26 — surpresa: a doc original (e o comentário em
//   legitimuz.adapter.ts) achava que kyc-faceindex não fazia captura de
//   documento, mas manda esse evento também, aparentemente numa etapa
//   anterior à de liveness/facematch da mesma sessão. NÃO tratamos isso
//   como aprovação — ver `ehEventoSoDocumento` abaixo: documento aprovado
//   sozinho não prova quem está do outro lado da câmera na hora da selfie,
//   só que existe um documento válido (que poderia até ser de outra
//   pessoa). Só liveness/facematch decide o status de
//   BiometriaVerificacao.
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

  const liveness = body.liveness as Record<string, unknown> | undefined;
  const facematch = body.facematch as Record<string, unknown> | undefined;

  return {
    refId: body.ref_id,
    status: body.status ?? liveness?.status ?? facematch?.status,
  };
}

// Evento reconhecido (tem ref_id) mas só de OCR, sem liveness/facematch —
// ver comentário acima. Reconhecemos e respondemos 200 (evita retry),
// mas de propósito NÃO extraímos status dele: aprovação de documento não
// deve nunca virar aprovação de biometria facial.
function ehEventoSoDocumento(body: Record<string, unknown>): boolean {
  return body.type !== "update" && !body.status && !body.liveness && !body.facematch && !!body.ocr;
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

  if (typeof refId !== "string" || !refId) {
    console.error(`Webhook Legitimuz: ref_id inválido — ref_id=${JSON.stringify(refId)}.`);
    return httpError("Payload de webhook inválido — ref_id é obrigatório.", 422);
  }

  if (typeof status !== "string" || !status) {
    if (ehEventoSoDocumento(body)) {
      console.warn(
        `Webhook Legitimuz: ref_id=${refId} é um evento só de OCR de documento — reconhecido, sem ação (não conta como biometria aprovada).`,
      );
      return httpOk({ processado: false, motivo: "Evento de OCR de documento — sem ação." });
    }

    console.error(
      `Webhook Legitimuz: status inválido — ref_id=${refId}, status=${JSON.stringify(status)}.`,
    );
    return httpError("Payload de webhook inválido — status é obrigatório.", 422);
  }

  const resultado = await webhookLegitimuzController.processar({ refId, status });

  // Sempre 200 pra payload reconhecido — evita retry indefinido pro que já
  // decidimos ignorar (status não reconhecido, verificação não encontrada).
  return httpOk(resultado);
}
