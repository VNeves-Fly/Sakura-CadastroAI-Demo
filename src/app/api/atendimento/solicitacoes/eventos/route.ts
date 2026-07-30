import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { postgresRealtimeListener } from "@/modules/shared/infrastructure/realtime/postgres-listener";
import { criarRespostaSse } from "@/modules/shared/presentation/sse/criar-resposta-sse";
import { atendimentoController } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { papelNaSolicitacao } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Notificação PESSOAL (só quem está envolvido) de pedido de transferência/
// assunção de atendimento do CADASTRO — canal próprio
// (solicitacao_atendimento_agencia_eventos), distinto do
// atendimento_eventos do chat. O payload do canal só tem ids; enriquece
// com nomes/status atuais (já auto-expirado-se-vencido) antes de mandar.
export async function GET(request: Request) {
  const session = await getServerSession(nextAuthOptions);
  const meuId = session?.user?.id;

  if (!meuId) {
    return new Response("Não autenticado.", { status: 401 });
  }

  return criarRespostaSse(request, (enviar) =>
    postgresRealtimeListener.subscribeSolicitacaoAtendimentoAgenciaEventos((evento) => {
      const envolveMim = [
        evento.solicitanteId,
        evento.atendenteAtualId,
        evento.novoAtendenteId,
      ].includes(meuId);
      if (!envolveMim) return;

      void atendimentoController
        .obterSolicitacaoAtendimentoAgencia(evento.solicitacaoId)
        .then((entity) => {
          if (!entity) return;
          enviar({ ...entity, meuPapel: papelNaSolicitacao(entity, meuId) });
        })
        .catch(() => {});
    }),
  );
}
