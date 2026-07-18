import { createHmac, timingSafeEqual } from "crypto";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { webhookD4SignController } from "@/modules/cadastro/presentation/controllers/webhook-d4sign.controller";

// D4Sign manda o webhook em FORM-DATA (não JSON) — confirmado na doc
// oficial (docapi.d4sign.com.br/docs/webhook-postback). Campos usados:
// uuid (= Contrato.provedorId) e type_post ("1" = documento finalizado).
export async function processarWebhookD4SignRoute(request: Request) {
  const formData = await request.formData();
  const uuid = formData.get("uuid");
  const typePost = formData.get("type_post");

  if (typeof uuid !== "string" || typeof typePost !== "string") {
    return httpError("Payload de webhook inválido — uuid e type_post são obrigatórios.", 422);
  }

  // Verificação de HMAC só roda se D4SIGN_WEBHOOK_SECRET estiver
  // configurada ("Gerar Secret Key MAC" na área de API do D4Sign) — sem
  // ela, aceita sem validar a origem (documentado, não travar o webhook
  // até a secret existir).
  const secret = process.env.D4SIGN_WEBHOOK_SECRET;
  if (secret) {
    const assinaturaRecebida = request.headers.get("content-hmac");
    if (!validarAssinatura(uuid, secret, assinaturaRecebida)) {
      return httpError("Assinatura HMAC inválida.", 401);
    }
  }

  const resultado = await webhookD4SignController.processar({ provedorId: uuid, typePost });

  // Sempre 200: o D4Sign reenvia por até ~27h se não receber 2xx — não
  // queremos retry pra eventos que já reconhecemos e decidimos ignorar
  // (ex.: type_post de e-mail não entregue).
  return httpOk(resultado);
}

function validarAssinatura(documentUuid: string, secret: string, header: string | null): boolean {
  if (!header) return false;

  const esperado = `sha256=${createHmac("sha256", secret).update(documentUuid).digest("hex")}`;
  const recebido = Buffer.from(header);
  const esperadoBuffer = Buffer.from(esperado);

  return recebido.length === esperadoBuffer.length && timingSafeEqual(recebido, esperadoBuffer);
}
