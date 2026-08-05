import { z } from "zod";

export const createGestorSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
    email: z.string().email("E-mail inválido.").nullable().default(null),
    telefone: z.string().nullable().default(null),
    baseIds: z.array(z.string()).default([]),
    criarAcesso: z.boolean().default(false),
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres.").optional(),
    mustChangePassword: z.boolean().default(false),
    useTemporaryPassword: z.boolean().default(false),
  })
  .refine((data) => !data.criarAcesso || Boolean(data.email), {
    message: "E-mail é obrigatório para criar acesso à plataforma.",
    path: ["email"],
  })
  .refine((data) => !data.criarAcesso || data.useTemporaryPassword || Boolean(data.password), {
    message: "Informe uma senha ou marque para gerar uma senha temporária.",
    path: ["password"],
  });

export type CreateGestorSchema = z.infer<typeof createGestorSchema>;
