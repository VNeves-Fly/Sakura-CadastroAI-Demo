import {
  createPromotorRoute,
  listPromotoresRoute,
} from "@/modules/atribuicoes/presentation/routes/promotores.routes";

export async function GET() {
  return listPromotoresRoute();
}

export async function POST(request: Request) {
  return createPromotorRoute(request);
}
