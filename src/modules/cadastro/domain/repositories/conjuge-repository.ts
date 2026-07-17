import type { Conjuge } from "@/modules/cadastro/domain/entities/conjuge.entity";

export interface CreateConjugeData {
  representanteLegalId: string;
  nome?: string | null;
  cpf?: string | null;
  rg?: string | null;
  nacionalidade?: string | null;
}

export type UpdateConjugeData = Partial<Omit<CreateConjugeData, "representanteLegalId">>;

export interface ConjugeRepository {
  findByRepresentanteLegalId(representanteLegalId: string): Promise<Conjuge | null>;
  create(data: CreateConjugeData): Promise<Conjuge>;
  update(representanteLegalId: string, data: UpdateConjugeData): Promise<Conjuge>;
}
