import { reenviarTemplateRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return reenviarTemplateRoute(request, params.id);
}
