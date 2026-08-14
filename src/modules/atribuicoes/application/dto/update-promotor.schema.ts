import { z } from "zod";

export const updatePromotorSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
    sica: z.number().int().positive().nullable().default(null),
    email: z.string().email("E-mail inválido."),
    telefone: z.string().nullable().default(null),
    gestorId: z.string().min(1, "Selecione um gestor."),
    baseIds: z.array(z.string()).default([]),
    criarAcesso: z.boolean().default(false),
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres.").optional(),
    mustChangePassword: z.boolean().default(false),
    useTemporaryPassword: z.boolean().default(false),
  })
  .refine((data) => !data.criarAcesso || data.useTemporaryPassword || Boolean(data.password), {
    message: "Informe uma senha ou marque para gerar uma senha temporária.",
    path: ["password"],
  });

export type UpdatePromotorSchema = z.infer<typeof updatePromotorSchema>;
