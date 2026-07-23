import { testarConexaoWhatsappRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request) {
  return testarConexaoWhatsappRoute(request);
}
