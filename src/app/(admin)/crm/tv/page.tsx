import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { tvController } from "@/modules/tv/presentation/controllers/tv.controller";
import { TvSecao } from "@/modules/tv/components/tv-secao";
import { TvSkeleton } from "@/modules/tv/components/tv-skeleton";

// "Fast View" — reprodução da página /tv do CRM Sakura original
// (spectvsakura.md). Mesmo guard de acesso do Dashboard CRM (pedido do
// usuário, 2026-08-13) — reaproveitado aqui por ser o mesmo tipo de
// painel executivo de vendas.
const CARGOS_COM_ACESSO = new Set(["ADMIN"]);

export default async function TvPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  // Disparado sem `await` — a página abre com o TvSkeleton na hora (ver
  // TvSkeleton) em vez de ficar em branco esperando tvController.
  // obterDados(), que dispara ~10 fetches concorrentes contra o SST
  // (overview hoje/ontem + vendas-por-companhia e top-clientes, um por
  // período — ver tv.sst-service.ts). Um único Suspense (não um por
  // seção): as 3 partes do payload (vendas/canais, shareAereo, top10) já
  // são buscadas em paralelo dentro de um `Promise.all` só no service —
  // a promise inteira resolve de uma vez, não tem como um pedaço chegar
  // primeiro sem reestruturar o service/controller.
  const dadosPromise = tvController.obterDados();

  return (
    <Suspense fallback={<TvSkeleton />}>
      <TvSecao dadosPromise={dadosPromise} />
    </Suspense>
  );
}
