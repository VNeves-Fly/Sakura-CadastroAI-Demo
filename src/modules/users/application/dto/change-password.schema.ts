import { z } from "zod";

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Senha deve ter ao menos 8 caracteres."),
});

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
