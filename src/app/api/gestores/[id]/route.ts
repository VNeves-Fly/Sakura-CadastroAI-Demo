import {
  getGestorByIdRoute,
  updateGestorRoute,
} from "@/modules/gestores/presentation/routes/gestores.routes";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getGestorByIdRoute(params.id);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updateGestorRoute(request, params.id);
}
