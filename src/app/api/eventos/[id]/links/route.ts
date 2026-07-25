import { criarEventoLinkRoute } from "@/modules/eventos/presentation/routes/eventos.routes";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return criarEventoLinkRoute(request, params.id);
}
