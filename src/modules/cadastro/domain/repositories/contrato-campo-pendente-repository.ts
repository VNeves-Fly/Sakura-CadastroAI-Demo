import type { ContratoCampoPendente } from "@/modules/cadastro/domain/entities/contrato-campo-pendente.entity";

export interface CreateContratoCampoPendenteData {
  contratoSignatarioId: string;
  campo?: string | null;
}

export interface ContratoCampoPendenteRepository {
  findByContratoSignatarioId(contratoSignatarioId: string): Promise<ContratoCampoPendente[]>;
  create(data: CreateContratoCampoPendenteData): Promise<ContratoCampoPendente>;
}
