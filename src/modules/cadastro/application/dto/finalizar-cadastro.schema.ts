import { z } from "zod";

export const enderecoMetaSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string(),
  bairro: z.string(),
  cidade: z.string(),
  uf: z.string(),
});

export const socioMetaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório."),
  cpf: z.string().min(1, "CPF é obrigatório."),
  email: z.string().email("E-mail inválido."),
  telefone: z.string().min(6, "Telefone inválido."),
  estadoCivil: z.string().min(1, "Estado civil é obrigatório."),
  endereco: enderecoMetaSchema,
  isRepresentante: z.boolean(),
});

export const enderecoBancoMetaSchema = z.object({
  enderecoMesmoSocio: z.boolean(),
  socioEnderecoVinculado: z.number().nullable(),
  endereco: enderecoMetaSchema.nullable(),
  bancoPais: z.string(),
  bancoNome: z.string().min(1, "Banco é obrigatório."),
  bancoAgencia: z.string().min(1, "Agência é obrigatória."),
  bancoConta: z.string().min(1, "Conta é obrigatória."),
  bancoSwift: z.string(),
  tipoConta: z.string().min(1, "Tipo de conta é obrigatório."),
  favorecidoEhEmpresa: z.boolean(),
  favorecidoNome: z.string().min(1, "Nome do favorecido é obrigatório."),
  favorecidoDoc: z.string().min(1, "Documento do favorecido é obrigatório."),
});

export const finalizarCadastroMetaSchema = z.object({
  cnpj: z
    .string()
    .regex(/^[A-Z0-9]{12}\d{2}$/, "CNPJ inválido. Verifique os caracteres digitados."),
  origem: z.string().trim().min(1).optional(),
  telefoneComercial: z.string(),
  emailOperacional: z.string(),
  emailComercial: z.string(),
  emailFinanceiro: z.string(),
  socios: z.array(socioMetaSchema).min(1, "Adicione ao menos um sócio."),
  enderecoBanco: enderecoBancoMetaSchema,
});

export type FinalizarCadastroMeta = z.infer<typeof finalizarCadastroMetaSchema>;
