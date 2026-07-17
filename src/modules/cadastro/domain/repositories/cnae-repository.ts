import type { Cnae } from "@/modules/cadastro/domain/entities/cnae.entity";

export interface CreateCnaeData {
  dadosReceitaId: string;
  codigo?: string | null;
  descricao?: string | null;
  principal?: boolean;
}

export interface CnaeRepository {
  findByDadosReceitaId(dadosReceitaId: string): Promise<Cnae[]>;
  create(data: CreateCnaeData): Promise<Cnae>;
}
