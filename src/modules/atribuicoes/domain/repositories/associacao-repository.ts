import type { Associacao } from "@/modules/atribuicoes/domain/entities/associacao.entity";

export interface CriarAssociacaoData {
  nome: string;
  ativo: boolean;
}

export interface AtualizarAssociacaoData {
  nome: string;
  ativo: boolean;
}

export interface AssociacaoRepository {
  findAll(): Promise<Associacao[]>;
  findById(id: string): Promise<Associacao | null>;
  criar(data: CriarAssociacaoData): Promise<Associacao>;
  atualizar(id: string, data: AtualizarAssociacaoData): Promise<Associacao>;
}
