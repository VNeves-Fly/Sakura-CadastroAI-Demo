import {
  criarTemplateRoute,
  listarTemplatesAprovadosRoute,
} from "@/modules/atendimento/presentation/routes/atendimento.routes";

export async function GET(request: Request) {
  return listarTemplatesAprovadosRoute(request);
}

export async function POST(request: Request) {
  return criarTemplateRoute(request);
}
