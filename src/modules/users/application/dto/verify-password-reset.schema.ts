import { z } from "zod";

export const verifyPasswordResetSchema = z.object({
  token: z.string().min(1, "Token é obrigatório."),
  codigo: z.string().regex(/^\d{6}$/, "Código deve ter 6 dígitos."),
});

export type VerifyPasswordResetSchema = z.infer<typeof verifyPasswordResetSchema>;
