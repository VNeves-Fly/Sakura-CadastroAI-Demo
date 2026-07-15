import { z } from "zod";

export const socioMetaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  telefone: z.string().min(10, "Telefone inválido."),
});

export const preCadastrarAgenciaMetaSchema = z.object({
  cnpj: z
    .string()
    .regex(/^[A-Z0-9]{12}\d{2}$/, "CNPJ inválido. Verifique os caracteres digitados."),
  origem: z.string().trim().min(1).optional(),
  socios: z.array(socioMetaSchema).min(1, "Adicione ao menos um sócio."),
});

export type PreCadastrarAgenciaMeta = z.infer<typeof preCadastrarAgenciaMetaSchema>;
