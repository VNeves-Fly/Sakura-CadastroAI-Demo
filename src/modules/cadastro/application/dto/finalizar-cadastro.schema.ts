import { z } from "zod";

const enderecoCoreSchema = {
  cep: z.string().min(1, "CEP é obrigatório."),
  logradouro: z.string().min(1, "Logradouro é obrigatório."),
  numero: z.string().min(1, "Número é obrigatório."),
  bairro: z.string().min(1, "Bairro é obrigatório."),
  cidade: z.string().min(1, "Cidade é obrigatória."),
  uf: z.string().min(1, "UF é obrigatória."),
};

// Complemento é opcional (sócio nem tem esse campo na tela; Endereço &
// Banco tem, mas nem todo endereço tem apto/sala/etc.).
export const enderecoMetaSchema = z.object({
  ...enderecoCoreSchema,
  complemento: z.string(),
});

export const socioMetaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório."),
  cpf: z.string().min(1, "CPF é obrigatório."),
  email: z.string().min(1, "E-mail é obrigatório.").email("E-mail inválido."),
  telefone: z.string().min(6, "Telefone inválido."),
  dataNascimento: z
    .string()
    .min(1, "Data de nascimento é obrigatória.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida.")
    .refine((valor) => !Number.isNaN(new Date(`${valor}T00:00:00`).getTime()), {
      message: "Data de nascimento inválida.",
    })
    .refine((valor) => new Date(`${valor}T00:00:00`) <= new Date(), {
      message: "Data de nascimento não pode ser no futuro.",
    })
    .refine(
      (valor) => {
        const hoje = new Date();
        const limite = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
        return new Date(`${valor}T00:00:00`) <= limite;
      },
      { message: "Sócio deve ser maior de idade (18 anos)." },
    ),
  estadoCivil: z.string().min(1, "Estado civil é obrigatório."),
  endereco: enderecoMetaSchema,
  isRepresentante: z.boolean(),
});

export const enderecoBancoMetaSchema = z
  .object({
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
  })
  .superRefine((data, ctx) => {
    if (data.bancoPais === "internacional" && data.bancoSwift.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SWIFT/BIC é obrigatório para conta internacional.",
        path: ["bancoSwift"],
      });
    }
  });

// Os 3 e-mails da empresa são opcionais (decisão explícita do usuário) —
// só validamos o formato quando algo for preenchido.
const emailOpcionalSchema = z
  .string()
  .refine((valor) => valor.length === 0 || z.string().email().safeParse(valor).success, {
    message: "E-mail inválido.",
  });

export const finalizarCadastroMetaSchema = z
  .object({
    cnpj: z
      .string()
      .regex(/^[A-Z0-9]{12}\d{2}$/, "CNPJ inválido. Verifique os caracteres digitados."),
    origem: z.string().trim().min(1).optional(),
    telefoneComercial: z.string(),
    semTelefoneComercial: z.boolean(),
    emailOperacional: emailOpcionalSchema,
    emailComercial: emailOpcionalSchema,
    emailFinanceiro: emailOpcionalSchema,
    socios: z.array(socioMetaSchema).min(1, "Adicione ao menos um sócio."),
    enderecoBanco: enderecoBancoMetaSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.semTelefoneComercial && data.telefoneComercial.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Telefone comercial é obrigatório.",
        path: ["telefoneComercial"],
      });
    }
  });

export type FinalizarCadastroMeta = z.infer<typeof finalizarCadastroMetaSchema>;
