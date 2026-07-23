import { enviarMensagemRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return enviarMensagemRoute(request, params.id);
}
