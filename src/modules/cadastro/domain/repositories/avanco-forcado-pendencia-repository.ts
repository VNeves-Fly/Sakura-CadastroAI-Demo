import type { AvancoForcadoPendencia } from "@/modules/cadastro/domain/entities/avanco-forcado-pendencia.entity";

export interface CreateAvancoForcadoPendenciaData {
  avancoForcadoId: string;
  descricao?: string | null;
}

export interface AvancoForcadoPendenciaRepository {
  findByAvancoForcadoId(avancoForcadoId: string): Promise<AvancoForcadoPendencia[]>;
  create(data: CreateAvancoForcadoPendenciaData): Promise<AvancoForcadoPendencia>;
}
