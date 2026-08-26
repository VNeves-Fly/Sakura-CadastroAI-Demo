import {
  getUserByIdRoute,
  updateUserRoute,
  deactivateUserRoute,
} from "@/modules/users/presentation/routes/users.routes";

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Busca um usuário pelo id
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
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getUserByIdRoute(params.id);
}

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Atualiza um usuário
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
 *         description: Usuário atualizado
 *       404:
 *         description: Usuário não encontrado
 *       409:
 *         description: E-mail já cadastrado por outro usuário
 *       422:
 *         description: Dados de entrada inválidos
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updateUserRoute(request, params.id);
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Remove o acesso de um usuário (desativa — não apaga o registro)
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
 *         description: Usuário desativado
 *       404:
 *         description: Usuário não encontrado
 */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return deactivateUserRoute(params.id);
}
