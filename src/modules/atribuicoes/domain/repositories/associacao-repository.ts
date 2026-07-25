import type { Associacao } from "@/modules/atribuicoes/domain/entities/associacao.entity";

export interface AssociacaoRepository {
  findAll(): Promise<Associacao[]>;
  findById(id: string): Promise<Associacao | null>;
}
