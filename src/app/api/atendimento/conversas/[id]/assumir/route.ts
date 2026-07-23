import { assumirAtendimentoRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return assumirAtendimentoRoute(request, params.id);
}
