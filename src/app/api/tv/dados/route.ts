import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { tvController } from "@/modules/tv/presentation/controllers/tv.controller";

// Alimenta o polling client-side do Fast View (ver tv-view.tsx) — mesmo
// guard de cargo do page.tsx (ADMIN), porque esta rota expõe os mesmos
// dados. `no-store`: cada poll deve refletir o estado atual do cache de
// 10min do tv.sst-service.ts, nunca um cache de HTTP por cima disso.
export const dynamic = "force-dynamic";

const CARGOS_COM_ACESSO = new Set(["ADMIN"]);

export async function GET() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const dados = await tvController.obterDados();
  return NextResponse.json(dados, { headers: { "Cache-Control": "no-store" } });
}
