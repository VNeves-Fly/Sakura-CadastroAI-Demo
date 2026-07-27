import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { NotFoundError } from "@/modules/shared/domain/errors";

// Serve o arquivo de um Documento (RG, procuração, contrato social) pro
// analista visualizar no dossiê — só autenticado, já que pode ser
// documento sensível (RG/CNH). Diferente de /api/users, que hoje não
// checa sessão nenhuma — aqui a checagem vem de propósito.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const { resultado, fileName } = await cadastroAdminController.obterArquivoDocumento(params.id);

    if (resultado.tipo === "redirect") {
      return NextResponse.redirect(resultado.url);
    }

    return new Response(new Uint8Array(resultado.buffer), {
      headers: {
        "Content-Type": resultado.mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
