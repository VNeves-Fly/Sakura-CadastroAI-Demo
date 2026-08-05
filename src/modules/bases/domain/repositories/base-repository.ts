import type { Base } from "@/modules/bases/domain/entities/base.entity";

export interface CriarBaseData {
  sigla: string;
  nomeCidade: string;
  uf: string;
}

export interface AtualizarBaseData {
  sigla: string;
  nomeCidade: string;
  uf: string;
}

export interface BaseRepository {
  findAll(): Promise<Base[]>;
  findById(id: string): Promise<Base | null>;
  findBySigla(sigla: string): Promise<Base | null>;
  criar(data: CriarBaseData): Promise<Base>;
  atualizar(id: string, data: AtualizarBaseData): Promise<Base>;
}
