import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { postgresRealtimeListener } from "@/modules/shared/infrastructure/realtime/postgres-listener";
import { criarRespostaSse } from "@/modules/shared/presentation/sse/criar-resposta-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Alimenta o live-update do dossiê /cadastros/[id] — repassa qualquer
// evento (agencia, documento, contrato, representante legal) cujo
// agenciaId seja o desta agência, já que o dossiê é composto quase
// inteiramente por essas sub-entidades.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return new Response("Não autenticado.", { status: 401 });
  }

  return criarRespostaSse(request, (enviar) =>
    postgresRealtimeListener.subscribeCadastroEventos((evento) => {
      if (evento.agenciaId !== params.id) return;
      enviar(evento);
    }),
  );
}
