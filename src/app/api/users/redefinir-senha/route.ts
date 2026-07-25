import { resetPasswordRoute } from "@/modules/users/presentation/routes/users.routes";

/**
 * @swagger
 * /api/users/redefinir-senha:
 *   post:
 *     summary: Define a nova senha após o código de recuperação já ter sido verificado
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido, expirado ou código ainda não verificado
 *       422:
 *         description: Dados de entrada inválidos
 */
export async function POST(request: Request) {
  return resetPasswordRoute(request);
}
