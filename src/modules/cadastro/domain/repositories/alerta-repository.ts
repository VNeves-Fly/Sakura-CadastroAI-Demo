import type { Alerta } from "@/modules/cadastro/domain/entities/alerta.entity";

export interface CreateAlertaData {
  agenciaId: string;
  tipo?: string | null;
  mensagem?: string | null;
}

export interface AlertaRepository {
  findByAgenciaId(agenciaId: string): Promise<Alerta[]>;
  create(data: CreateAlertaData): Promise<Alerta>;
  resolver(id: string): Promise<Alerta>;
}
