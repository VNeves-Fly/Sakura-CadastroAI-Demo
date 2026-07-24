import { z } from "zod";

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório."),
  newPassword: z.string().min(8, "Senha deve ter ao menos 8 caracteres."),
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
