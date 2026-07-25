import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

export type RequestPasswordResetSchema = z.infer<typeof requestPasswordResetSchema>;
