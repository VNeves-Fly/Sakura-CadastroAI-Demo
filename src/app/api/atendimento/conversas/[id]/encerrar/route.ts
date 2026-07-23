import { encerrarAtendimentoRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return encerrarAtendimentoRoute(request, params.id);
}
