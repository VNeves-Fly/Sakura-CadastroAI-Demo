import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { requestPasswordResetForUserRoute } from "@/modules/users/presentation/routes/users.routes";

/**
 * @swagger
 * /api/users/{id}/recuperar-senha:
 *   post:
 *     summary: Dispara o e-mail de recuperação de senha pra um usuário específico (ação de admin)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: E-mail de recuperação enviado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Usuário não encontrado
 *       429:
 *         description: Muitas tentativas
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  return requestPasswordResetForUserRoute(params.id);
}
