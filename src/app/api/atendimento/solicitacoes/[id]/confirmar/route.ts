import { confirmarSolicitacaoAgenciaRoute } from "@/modules/atendimento/presentation/routes/atendimento-agencia.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return confirmarSolicitacaoAgenciaRoute(request, params.id);
}
