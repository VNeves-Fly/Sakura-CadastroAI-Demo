import {
  getBaseByIdRoute,
  updateBaseRoute,
} from "@/modules/bases/presentation/routes/bases.routes";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getBaseByIdRoute(params.id);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updateBaseRoute(request, params.id);
}
