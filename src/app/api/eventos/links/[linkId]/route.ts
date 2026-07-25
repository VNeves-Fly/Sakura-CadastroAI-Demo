import { alternarAtivoLinkRoute } from "@/modules/eventos/presentation/routes/eventos.routes";

export async function PATCH(request: Request, { params }: { params: { linkId: string } }) {
  return alternarAtivoLinkRoute(request, params.linkId);
}
