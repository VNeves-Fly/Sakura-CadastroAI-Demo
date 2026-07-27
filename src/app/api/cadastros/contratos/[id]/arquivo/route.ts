import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { NotFoundError } from "@/modules/shared/domain/errors";

// Serve o PDF do contrato pro botão "Visualizar Documento" do dossiê —
// mesmo padrão de autenticação de /api/cadastros/documentos/[id]/arquivo.
// Diferente daquela rota, aqui não existe variante "redirect" (o D4Sign
// não expõe signed-URL nesse endpoint, ver D4SignAdapter.visualizarDocumento):
// sempre stream do buffer.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const { buffer, mimeType } = await cadastroAdminController.obterArquivoContrato(params.id);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": 'inline; filename="contrato.pdf"',
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
