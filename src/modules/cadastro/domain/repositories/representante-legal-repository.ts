import type { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type { PapelRepresentante } from "@/modules/cadastro/domain/enums";

export interface CreateRepresentanteLegalData {
  agenciaId: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cnpj?: string | null;
  isPj?: boolean;
  rg?: string | null;
  rgOrgaoEmissor?: string | null;
  dataNascimento?: Date | null;
  estadoCivil: string;
  regimeBens?: string | null;
  nacionalidade?: string | null;
  cargo?: string | null;
  papel?: PapelRepresentante;
  isRepresentanteLegal?: boolean;
  origem?: string | null;
  preenchidoPorIa?: boolean;
}

export type UpdateRepresentanteLegalData = Partial<
  Omit<CreateRepresentanteLegalData, "agenciaId">
> & {
  ativo?: boolean;
};

export interface RepresentanteLegalRepository {
  findById(id: string): Promise<RepresentanteLegal | null>;
  findByAgenciaId(agenciaId: string): Promise<RepresentanteLegal[]>;
  findByAgenciaIdAndCpf(agenciaId: string, cpf: string): Promise<RepresentanteLegal | null>;
  create(data: CreateRepresentanteLegalData): Promise<RepresentanteLegal>;
  update(id: string, data: UpdateRepresentanteLegalData): Promise<RepresentanteLegal>;
}
