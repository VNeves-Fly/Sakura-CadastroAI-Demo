import type { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type { PapelRepresentante } from "@/modules/cadastro/domain/enums";
import type { EnderecoData } from "@/modules/cadastro/domain/repositories/agencia-repository";

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
  administrativo?: boolean | null;
  origem?: string | null;
  preenchidoPorIa?: boolean;
}

export type UpdateRepresentanteLegalData = Partial<
  Omit<CreateRepresentanteLegalData, "agenciaId">
> & {
  ativo?: boolean;
  // Editável pelo analista junto do resto do sócio (dossiê, 2026-08-05) —
  // relação 1:1 opcional (RepresentanteLegal.endereco), upsertada no
  // repositório (o sócio pode não ter endereço nenhum ainda).
  endereco?: EnderecoData;
};

export interface RepresentanteLegalRepository {
  findById(id: string): Promise<RepresentanteLegal | null>;
  findByAgenciaId(agenciaId: string): Promise<RepresentanteLegal[]>;
  findByAgenciaIdAndCpf(agenciaId: string, cpf: string): Promise<RepresentanteLegal | null>;
  create(data: CreateRepresentanteLegalData): Promise<RepresentanteLegal>;
  update(id: string, data: UpdateRepresentanteLegalData): Promise<RepresentanteLegal>;
}
