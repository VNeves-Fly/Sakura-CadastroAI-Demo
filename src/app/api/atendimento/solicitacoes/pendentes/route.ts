import { listarSolicitacoesAgenciaPendentesRoute } from "@/modules/atendimento/presentation/routes/atendimento-agencia.routes";

export async function GET(request: Request) {
  return listarSolicitacoesAgenciaPendentesRoute(request);
}
