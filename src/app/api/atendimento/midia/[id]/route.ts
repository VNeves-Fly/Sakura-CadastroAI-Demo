import { obterArquivoMidiaRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return obterArquivoMidiaRoute(request, params.id);
}
