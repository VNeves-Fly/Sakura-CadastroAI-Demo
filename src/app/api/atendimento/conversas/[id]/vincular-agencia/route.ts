import { vincularConversaAgenciaRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return vincularConversaAgenciaRoute(request, params.id);
}
