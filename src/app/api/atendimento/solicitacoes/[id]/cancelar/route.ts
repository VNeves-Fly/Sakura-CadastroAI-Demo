import { cancelarSolicitacaoAgenciaRoute } from "@/modules/atendimento/presentation/routes/atendimento-agencia.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return cancelarSolicitacaoAgenciaRoute(request, params.id);
}
