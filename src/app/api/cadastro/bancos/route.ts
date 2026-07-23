import { listarBancosRoute } from "@/modules/cadastro/presentation/routes/cadastro-publico.routes";

export async function GET(request: Request) {
  return listarBancosRoute(request);
}
