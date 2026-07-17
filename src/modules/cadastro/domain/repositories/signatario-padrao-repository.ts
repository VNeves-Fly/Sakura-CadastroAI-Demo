import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";

export interface CreateSignatarioPadraoData {
  nome?: string | null;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  ordem?: number | null;
}

export interface SignatarioPadraoRepository {
  findAll(): Promise<SignatarioPadrao[]>;
  findAtivos(): Promise<SignatarioPadrao[]>;
  create(data: CreateSignatarioPadraoData): Promise<SignatarioPadrao>;
}
