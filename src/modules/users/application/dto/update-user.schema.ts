import { z } from "zod";
import { CARGOS } from "@/modules/users/application/dto/create-user.schema";

export const updateUserSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  lastName: z.string().min(2, "Sobrenome deve ter ao menos 2 caracteres."),
  email: z.string().email("E-mail inválido."),
  phone: z.string().min(10, "Telefone inválido."),
  cargo: z.enum(CARGOS, { errorMap: () => ({ message: "Cargo inválido." }) }),
  ativo: z.boolean(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
