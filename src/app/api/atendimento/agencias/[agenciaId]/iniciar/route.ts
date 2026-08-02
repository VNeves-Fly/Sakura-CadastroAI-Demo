import { iniciarAtendimentoAgenciaRoute } from "@/modules/atendimento/presentation/routes/atendimento-agencia.routes";

export async function POST(request: Request, { params }: { params: { agenciaId: string } }) {
  return iniciarAtendimentoAgenciaRoute(request, params.agenciaId);
}
