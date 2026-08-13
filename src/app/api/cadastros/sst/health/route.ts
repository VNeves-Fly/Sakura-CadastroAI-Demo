import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";

// "Testar conexão" com o SST (sst.flysakura.com) — só autenticado, mesmo
// padrão de /api/atendimento/messenger/testar-conexao.
export async function GET() {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const resultado = await cadastroAdminController.testarConexaoSst();
  return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 502 });
}
