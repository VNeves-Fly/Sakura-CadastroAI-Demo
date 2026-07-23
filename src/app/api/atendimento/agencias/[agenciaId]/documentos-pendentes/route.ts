import { listarDocumentosPendentesAgenciaRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function GET(request: Request, { params }: { params: { agenciaId: string } }) {
  return listarDocumentosPendentesAgenciaRoute(request, params.agenciaId);
}
