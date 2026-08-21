import { processarWebhookLegitimuzRoute } from "@/modules/cadastro/presentation/routes/webhook-legitimuz.routes";

export async function POST(request: Request) {
  return processarWebhookLegitimuzRoute(request);
}
