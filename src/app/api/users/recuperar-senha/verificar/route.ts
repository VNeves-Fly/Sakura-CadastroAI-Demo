import { verifyPasswordResetCodeRoute } from "@/modules/users/presentation/routes/users.routes";

/**
 * @swagger
 * /api/users/recuperar-senha/verificar:
 *   post:
 *     summary: Verifica o token (da URL do e-mail) e o código de 6 dígitos da recuperação de senha
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, codigo]
 *             properties:
 *               token:
 *                 type: string
 *               codigo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código válido — libera a definição de nova senha
 *       400:
 *         description: Código inválido, expirado ou tentativas excedidas
 *       422:
 *         description: Dados de entrada inválidos
 *       429:
 *         description: Muitas tentativas
 */
export async function POST(request: Request) {
  return verifyPasswordResetCodeRoute(request);
}
