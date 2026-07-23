// LEGADO — sem chamador ativo no client (wizard não consulta mais
// ReceitaWS ao digitar o CNPJ). Mantido por decisão do usuário para
// eventual uso futuro.
import { consultarQsaRoute } from "@/modules/cadastro/presentation/routes/cadastro-publico.routes";

export async function POST(request: Request) {
  return consultarQsaRoute(request);
}
