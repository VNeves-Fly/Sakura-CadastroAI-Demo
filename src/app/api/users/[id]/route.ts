import { getUserByIdRoute } from "@/modules/users/presentation/routes/users.routes";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getUserByIdRoute(params.id);
}
