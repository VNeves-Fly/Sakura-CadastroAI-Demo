import { responderTransferenciaRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return responderTransferenciaRoute(request, params.id);
}
