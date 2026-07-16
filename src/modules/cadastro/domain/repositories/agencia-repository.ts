import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Socio } from "@/modules/cadastro/domain/entities/socio";

export interface CreateAgenciaData {
  razaoSocial: string;
  cnpj: string;
  contratoSocialPath: string;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  socios: Socio[];
}

export interface AgenciaRepository {
  findByCnpj(cnpj: string): Promise<Agencia | null>;
  create(data: CreateAgenciaData): Promise<Agencia>;
}
