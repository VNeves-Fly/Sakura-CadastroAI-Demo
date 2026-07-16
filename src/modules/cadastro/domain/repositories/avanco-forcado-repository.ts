import type { AvancoForcado } from "@/modules/cadastro/domain/entities/avanco-forcado.entity";

export interface CreateAvancoForcadoData {
  agenciaId: string;
  etapaAlvo?: number | null;
  motivo?: string | null;
  gateMotivoBloqueio?: string | null;
  statusReal?: string | null;
  solicitadoPor?: string | null;
  autorizadoPor?: string | null;
}

export interface AvancoForcadoRepository {
  findById(id: string): Promise<AvancoForcado | null>;
  findByAgenciaId(agenciaId: string): Promise<AvancoForcado[]>;
  create(data: CreateAvancoForcadoData): Promise<AvancoForcado>;
}
