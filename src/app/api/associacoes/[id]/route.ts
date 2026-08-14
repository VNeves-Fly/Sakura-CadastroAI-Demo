import {
  getAssociacaoByIdRoute,
  updateAssociacaoRoute,
} from "@/modules/associacoes/presentation/routes/associacoes.routes";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getAssociacaoByIdRoute(params.id);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updateAssociacaoRoute(request, params.id);
}
