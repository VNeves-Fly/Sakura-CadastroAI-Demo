import {
  atualizarTextoProntoRoute,
  removerTextoProntoRoute,
} from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return atualizarTextoProntoRoute(request, params.id);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return removerTextoProntoRoute(request, params.id);
}
