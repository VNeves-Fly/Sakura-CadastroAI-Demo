import { requestPasswordResetRoute } from "@/modules/users/presentation/routes/users.routes";

/**
 * @swagger
 * /api/users/recuperar-senha:
 *   post:
 *     summary: Pede um código de recuperação de senha (OTP de 6 dígitos, válido por 30min) por e-mail
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Se o e-mail existir, o código foi enviado (resposta não revela se o e-mail existe)
 *       422:
 *         description: Dados de entrada inválidos
 *       429:
 *         description: Muitas tentativas
 */
export async function POST(request: Request) {
  return requestPasswordResetRoute(request);
}
