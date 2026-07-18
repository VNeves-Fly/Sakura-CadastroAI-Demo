import { processarWebhookD4SignRoute } from "@/modules/cadastro/presentation/routes/webhook-d4sign.routes";

export async function POST(request: Request) {
  return processarWebhookD4SignRoute(request);
}
