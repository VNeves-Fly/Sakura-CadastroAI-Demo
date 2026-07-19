import { createHmac, timingSafeEqual } from "crypto";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { webhookD4SignController } from "@/modules/cadastro/presentation/controllers/webhook-d4sign.controller";

// D4Sign manda o webhook em FORM-DATA (não JSON) — confirmado na doc
// oficial (docapi.d4sign.com.br/docs/webhook-postback). Campos usados:
// uuid (= Contrato.provedorId), type_post ("1" = documento finalizado,
// "2" = e-mail não entregue, "4" = assinatura individual), email
// (presente no "2" e "4") e message (presente no "2", motivo da falha).
export async function processarWebhookD4SignRoute(request: Request) {
  const formData = await request.formData();
  const uuid = formData.get("uuid");
  const typePost = formData.get("type_post");
  const email = formData.get("email");
  const message = formData.get("message");

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

function validarAssinatura(documentUuid: string, secret: string, header: string | null): boolean {
  if (!header) return false;

  const esperado = `sha256=${createHmac("sha256", secret).update(documentUuid).digest("hex")}`;
  const recebido = Buffer.from(header);
  const esperadoBuffer = Buffer.from(esperado);

  return recebido.length === esperadoBuffer.length && timingSafeEqual(recebido, esperadoBuffer);
}
