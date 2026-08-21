import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { obterUrlBase } from "@/modules/shared/utils/url-base.util";

// Rotina de FollowUp (cron diário, ver vercel.json/vercel.ts) — lembra
// sócios de agências com Agencia.gateBiometriaAtivo que ainda não
// terminaram a biometria ou a assinatura, já que o D4Sign não notifica
// mais ninguém sozinho nesse fluxo (skip_email:"1", ver docs/legitimuz/).
// Padrão de autenticação do Vercel Cron: header Authorization: Bearer
// <CRON_SECRET>, injetado automaticamente pela plataforma quando a rota
// está declarada em `crons`.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET não configurada — rota de lembrete bloqueada.");
    return Response.json({ error: "CRON_SECRET não configurada." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const resultado = await cadastroAdminController.enviarLembretesAssinatura(
    obterUrlBase(request.headers),
  );

  return Response.json(resultado);
}
