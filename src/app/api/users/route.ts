import { createUserRoute, listUsersRoute } from "@/modules/users/presentation/routes/users.routes";

export async function GET() {
  return listUsersRoute();
}

export async function POST(request: Request) {
  return createUserRoute(request);
}
