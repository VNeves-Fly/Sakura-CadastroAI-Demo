import {
  getPromotorByIdRoute,
  updatePromotorRoute,
} from "@/modules/atribuicoes/presentation/routes/promotores.routes";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getPromotorByIdRoute(params.id);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updatePromotorRoute(request, params.id);
}
