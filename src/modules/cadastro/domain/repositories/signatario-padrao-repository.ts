import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";

export interface CreateSignatarioPadraoData {
  nome?: string | null;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  ordem?: number | null;
  papel: PapelSignatarioPadrao;
  estagio: number;
}

export interface UpdateSignatarioPadraoData {
  nome?: string | null;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  ordem?: number | null;
  papel?: PapelSignatarioPadrao;
  estagio?: number;
}

export interface SignatarioPadraoRepository {
  findAll(): Promise<SignatarioPadrao[]>;
  // Ativos = deletedAt null — usado pelo D4SignAdapter/webhook pra montar
  // a fila de assinatura de verdade.
  findAtivos(): Promise<SignatarioPadrao[]>;
  findById(id: string): Promise<SignatarioPadrao | null>;
  create(data: CreateSignatarioPadraoData): Promise<SignatarioPadrao>;
  update(id: string, data: UpdateSignatarioPadraoData): Promise<SignatarioPadrao>;
  // Soft delete — marca deletedAt (agora); reversível via restaurar().
  softDelete(id: string): Promise<void>;
  restaurar(id: string): Promise<void>;
}
