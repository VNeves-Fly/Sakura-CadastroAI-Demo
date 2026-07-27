import { iniciarConversaRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request) {
  return iniciarConversaRoute(request);
}
