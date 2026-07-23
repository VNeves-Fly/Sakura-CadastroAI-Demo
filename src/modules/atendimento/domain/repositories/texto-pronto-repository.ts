import type { TextoProntoEntity } from "@/modules/atendimento/domain/entities/texto-pronto.entity";

export interface CriarTextoProntoData {
  titulo: string;
  conteudo: string;
  criadoPorId: string | null;
}

export interface AtualizarTextoProntoData {
  titulo: string;
  conteudo: string;
}

export interface TextoProntoRepository {
  findAll(): Promise<TextoProntoEntity[]>;
  findById(id: string): Promise<TextoProntoEntity | null>;
  create(data: CriarTextoProntoData): Promise<TextoProntoEntity>;
  update(id: string, data: AtualizarTextoProntoData): Promise<TextoProntoEntity>;
  remover(id: string): Promise<void>;
}
