import type { ContratoSignatario } from "@/modules/cadastro/domain/entities/contrato-signatario.entity";

// Exatamente um dos dois é preenchido — ver contrato-signatario.entity.ts.
export interface CreateContratoSignatarioData {
  contratoId: string;
  representanteLegalId?: string | null;
  signatarioPadraoId?: string | null;
  nome: string;
  email: string;
  cpf: string;
  rg?: string | null;
  rgOrgaoEmissor?: string | null;
  cargo?: string | null;
  nacionalidade?: string | null;
  estadoCivil?: string | null;
  dataNascimento?: Date | null;
  cepSnapshot?: string | null;
  logradouroSnapshot?: string | null;
  numeroSnapshot?: string | null;
  complementoSnapshot?: string | null;
  bairroSnapshot?: string | null;
  cidadeSnapshot?: string | null;
  ufSnapshot?: string | null;
}

export interface ContratoSignatarioRepository {
  findById(id: string): Promise<ContratoSignatario | null>;
  findByContratoId(contratoId: string): Promise<ContratoSignatario[]>;
  create(data: CreateContratoSignatarioData): Promise<ContratoSignatario>;
}
