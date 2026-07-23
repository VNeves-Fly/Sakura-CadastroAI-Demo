import {
  criarTextoProntoRoute,
  listarTextosProntosRoute,
} from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function GET(request: Request) {
  return listarTextosProntosRoute(request);
}

export async function POST(request: Request) {
  return criarTextoProntoRoute(request);
}
