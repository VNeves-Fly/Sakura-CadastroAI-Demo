import { obterConfiguracaoWhatsappRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function GET(request: Request) {
  return obterConfiguracaoWhatsappRoute(request);
}
