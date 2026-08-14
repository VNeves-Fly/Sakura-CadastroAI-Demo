import {
  createGestorRoute,
  listGestoresRoute,
} from "@/modules/gestores/presentation/routes/gestores.routes";

export async function GET() {
  return listGestoresRoute();
}

export async function POST(request: Request) {
  return createGestorRoute(request);
}
