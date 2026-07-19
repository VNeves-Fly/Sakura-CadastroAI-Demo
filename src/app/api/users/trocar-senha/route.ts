import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { changePasswordRoute } from "@/modules/users/presentation/routes/users.routes";

/**
 * @swagger
 * /api/users/trocar-senha:
 *   post:
 *     summary: Troca a senha do usuário autenticado (fluxo de primeiro acesso)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha trocada com sucesso
 *       401:
 *         description: Não autenticado
 *       422:
 *         description: Dados de entrada inválidos
 */
export async function POST(request: Request) {
  const session = await getServerSession(nextAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  return changePasswordRoute(request, session.user.id);
}
