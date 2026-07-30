import { atualizarTemplateMetadataRoute } from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return atualizarTemplateMetadataRoute(request, params.id);
}
