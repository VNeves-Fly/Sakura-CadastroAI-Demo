import { z } from "zod";

export const CARGOS = ["ADMIN", "DIRETOR_ANALISTA", "ANALISTA", "GESTOR", "EXECUTIVO"] as const;

export const createUserSchema = z
  .object({
    firstName: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
    lastName: z.string().min(2, "Sobrenome deve ter ao menos 2 caracteres."),
    email: z.string().email("E-mail inválido."),
    phone: z.string().min(10, "Telefone inválido."),
    cargo: z.enum(CARGOS, { errorMap: () => ({ message: "Cargo inválido." }) }),
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres.").optional(),
    mustChangePassword: z.boolean().default(false),
    useTemporaryPassword: z.boolean().default(false),
  })
  .refine((data) => data.useTemporaryPassword || Boolean(data.password), {
    message: "Informe uma senha ou marque para gerar uma senha temporária.",
    path: ["password"],
  });

export type CreateUserSchema = z.infer<typeof createUserSchema>;
