import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { obterUrlBase } from "@/modules/shared/utils/url-base.util";

// Rotina de FollowUp (cron diário) — lembra sócios de agências com
// Agencia.gateBiometriaAtivo que ainda não terminaram a biometria ou a
// assinatura, já que o D4Sign não notifica mais ninguém sozinho nesse
// fluxo (skip_email:"1", ver docs/legitimuz/).
//
// Deploy é Cloud Run (`cadastro-ai-prod`, ver docs/realtime-sse.md), não
// Vercel — o disparo diário precisa ser um job HTTP do Google Cloud
// Scheduler chamando esta rota (não existe `vercel.json`/crons aqui).
// Header `Authorization: Bearer <CRON_SECRET>` precisa ser configurado no
// job do Scheduler manualmente (OIDC token headers do Scheduler não batem
// com esse formato — usar "Add Header" no job, não auth automática).
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
