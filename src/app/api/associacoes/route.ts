import {
  createAssociacaoRoute,
  listAssociacoesRoute,
} from "@/modules/associacoes/presentation/routes/associacoes.routes";

export async function GET() {
  return listAssociacoesRoute();
}

export async function POST(request: Request) {
  return createAssociacaoRoute(request);
}
