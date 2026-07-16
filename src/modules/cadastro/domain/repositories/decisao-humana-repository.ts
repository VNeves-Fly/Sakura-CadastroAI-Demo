import type { DecisaoHumana } from "@/modules/cadastro/domain/entities/decisao-humana.entity";
import type { EtapaDecisao, ResultadoDecisao } from "@/modules/cadastro/domain/enums";

export interface CreateDecisaoHumanaData {
  agenciaId: string;
  etapa?: EtapaDecisao | null;
  decisaoIa?: string | null;
  decisaoHumana?: ResultadoDecisao | null;
  justificativa?: string | null;
  usuarioEmail?: string | null;
  modeloIa?: string | null;
  scoreIa?: number | null;
  divergiu?: boolean | null;
}

export interface DecisaoHumanaRepository {
  findByAgenciaId(agenciaId: string): Promise<DecisaoHumana[]>;
  create(data: CreateDecisaoHumanaData): Promise<DecisaoHumana>;
}
