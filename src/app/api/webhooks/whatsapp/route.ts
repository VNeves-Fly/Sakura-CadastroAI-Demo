import {
  processarWebhookWhatsAppRoute,
  verificarWebhookWhatsAppRoute,
} from "@/modules/atendimento/presentation/routes/webhook-whatsapp.routes";

export async function GET(request: Request) {
  return verificarWebhookWhatsAppRoute(request);
}

export async function POST(request: Request) {
  return processarWebhookWhatsAppRoute(request);
}
