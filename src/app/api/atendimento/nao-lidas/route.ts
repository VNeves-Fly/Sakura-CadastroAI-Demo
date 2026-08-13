import { contarMensagensNaoLidasRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function GET(request: Request) {
  return contarMensagensNaoLidasRoute(request);
}
