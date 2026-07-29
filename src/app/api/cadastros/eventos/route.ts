import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { postgresRealtimeListener } from "@/modules/shared/infrastructure/realtime/postgres-listener";
import { criarRespostaSse } from "@/modules/shared/presentation/sse/criar-resposta-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Alimenta o live-update da lista /cadastros — só repassa eventos da
// própria tabela "agencias" (novo cadastro, mudança de status/executivo/
// associação/evento), que é tudo que a tabela da tela exibe hoje. Em
// INSERT, enriquece com a razão social (evento.id == id da agência nessa
// tabela) pra alimentar o toast de "novo cadastro" com o nome da empresa.
export async function GET(request: Request) {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return new Response("Não autenticado.", { status: 401 });
  }

  return criarRespostaSse(request, (enviar) =>
    postgresRealtimeListener.subscribeCadastroEventos((evento) => {
      if (evento.tabela !== "agencias") return;

      if (evento.tipo === "INSERT") {
        void prisma.agencia
          .findUnique({ where: { id: evento.id }, select: { razaoSocial: true } })
          .then((agencia) => enviar({ ...evento, razaoSocial: agencia?.razaoSocial ?? null }))
          .catch(() => enviar(evento));
        return;
      }

      enviar(evento);
    }),
  );
}
