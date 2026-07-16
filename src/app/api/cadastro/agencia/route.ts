import { createAgenciaRoute } from "@/modules/cadastro/presentation/routes/cadastro-publico.routes";

export async function POST(request: Request) {
  return createAgenciaRoute(request);
}
