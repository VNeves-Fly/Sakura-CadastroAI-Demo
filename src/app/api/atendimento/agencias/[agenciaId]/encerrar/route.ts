import { encerrarAtendimentoAgenciaRoute } from "@/modules/atendimento/presentation/routes/atendimento-agencia.routes";

export async function POST(request: Request, { params }: { params: { agenciaId: string } }) {
  return encerrarAtendimentoAgenciaRoute(request, params.agenciaId);
}
