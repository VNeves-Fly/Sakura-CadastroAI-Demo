import { obterContatoAgenciaRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function GET(request: Request, { params }: { params: { agenciaId: string } }) {
  return obterContatoAgenciaRoute(request, params.agenciaId);
}
