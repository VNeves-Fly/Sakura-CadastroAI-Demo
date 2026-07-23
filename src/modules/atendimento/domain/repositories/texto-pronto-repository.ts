import type { TextoProntoEntity } from "@/modules/atendimento/domain/entities/texto-pronto.entity";

export interface CriarTextoProntoData {
  titulo: string;
  conteudo: string;
  criadoPorId: string | null;
}

export interface TextoProntoRepository {
  findAll(): Promise<TextoProntoEntity[]>;
  create(data: CriarTextoProntoData): Promise<TextoProntoEntity>;
}
