import type { GateValidacao } from "@/modules/cadastro/domain/entities/gate-validacao.entity";

export interface CreateGateValidacaoData {
  agenciaId: string;
  etapaAlvo?: number | null;
  liberado?: boolean | null;
  motivoBloqueio?: string | null;
}

export interface GateValidacaoRepository {
  findByAgenciaId(agenciaId: string): Promise<GateValidacao[]>;
  create(data: CreateGateValidacaoData): Promise<GateValidacao>;
}
