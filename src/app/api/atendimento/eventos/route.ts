import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { postgresRealtimeListener } from "@/modules/shared/infrastructure/realtime/postgres-listener";
import { criarRespostaSse } from "@/modules/shared/presentation/sse/criar-resposta-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Alimenta o live-update de /atendimento — repassa qualquer evento (nova
// mensagem, atendimento assumido/liberado, transferência solicitada/
// respondida); o client sempre refaz listarConversas() por completo ao
// receber, igual ao polling de 4s que este canal substitui.
export async function GET(request: Request) {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return new Response("Não autenticado.", { status: 401 });
  }

  return criarRespostaSse(request, (enviar) =>
    postgresRealtimeListener.subscribeAtendimentoEventos((evento) => enviar(evento)),
  );
}
