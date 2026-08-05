import { createBaseRoute, listBasesRoute } from "@/modules/bases/presentation/routes/bases.routes";

export async function GET() {
  return listBasesRoute();
}

export async function POST(request: Request) {
  return createBaseRoute(request);
}
