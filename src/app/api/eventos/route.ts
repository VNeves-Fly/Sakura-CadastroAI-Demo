import {
  criarEventoRoute,
  listarEventosRoute,
} from "@/modules/eventos/presentation/routes/eventos.routes";

export async function GET(request: Request) {
  return listarEventosRoute(request);
}

export async function POST(request: Request) {
  return criarEventoRoute(request);
}
