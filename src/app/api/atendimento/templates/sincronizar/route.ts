import { sincronizarTemplatesRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request) {
  return sincronizarTemplatesRoute(request);
}
