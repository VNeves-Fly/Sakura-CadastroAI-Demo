import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { postgresRealtimeListener } from "@/modules/shared/infrastructure/realtime/postgres-listener";
import { criarRespostaSse } from "@/modules/shared/presentation/sse/criar-resposta-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LABEL_TIPO_DOCUMENTO: Record<string, string> = {
  CONTRATO_SOCIAL: "Contrato Social",
  RG_CNPJ: "RG/CNH",
  PROCURACAO: "Procuração",
};

// Notificação global (qualquer analista logado, não só quem está na
// agência) de novo documento recebido — assina o mesmo canal
// "cadastro_eventos" das outras rotas SSE, só filtrando pra tabela
// "documentos"/INSERT (o canal do Postgres já cobre isso, de qualquer
// origem — upload inicial do wizard, reenvio público, inserção manual,
// vincular mídia do chat). O payload do canal só tem ids; enriquece com
// um lookup rápido antes de repassar pro client.
export async function GET(request: Request) {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return new Response("Não autenticado.", { status: 401 });
  }

  return criarRespostaSse(request, (enviar) =>
    postgresRealtimeListener.subscribeCadastroEventos((evento) => {
      if (evento.tabela !== "documentos" || evento.tipo !== "INSERT") return;

      void prisma.documento
        .findUnique({
          where: { id: evento.id },
          select: {
            tipo: true,
            representanteLegal: { select: { nome: true } },
            agencia: { select: { razaoSocial: true } },
          },
        })
        .then((documento) => {
          if (!documento) return;
          enviar({
            agenciaId: evento.agenciaId,
            agenciaNome: documento.agencia.razaoSocial,
            tipoDocumento: LABEL_TIPO_DOCUMENTO[documento.tipo] ?? documento.tipo,
            nomeSocio: documento.representanteLegal?.nome ?? null,
          });
        })
        .catch(() => {});
    }),
  );
}
