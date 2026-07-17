import type { CadastroComplementar } from "@/modules/cadastro/domain/entities/cadastro-complementar.entity";

export interface CreateCadastroComplementarData {
  agenciaId: string;
  telefoneComercial?: string | null;
  emailOperacional?: string | null;
  emailComercial?: string | null;
  emailFinanceiro?: string | null;
  cadasturNumero?: string | null;
  cadasturDataCadastro?: Date | null;
  cadasturValidade?: Date | null;
  cadasturSituacao?: string | null;
  resideBrasil?: boolean | null;
  tipoAgencia?: string | null;
  enderecoAgenciaMesmoTitular?: boolean | null;
  socioVinculadoEnderecoId?: string | null;
  bancoPais?: string | null;
  bancoNome?: string | null;
  bancoAgencia?: string | null;
  bancoConta?: string | null;
  bancoSwift?: string | null;
  tipoConta?: string | null;
  favorecidoEhEmpresa?: boolean | null;
  favorecidoNome?: string | null;
  favorecidoDoc?: string | null;
  chavePix?: string | null;
  tipoChavePix?: string | null;
  tipoFaturamento?: string | null;
  percCorporativo?: number | null;
  percConvencional?: number | null;
}

export type UpdateCadastroComplementarData = Partial<
  Omit<CreateCadastroComplementarData, "agenciaId">
> & {
  submetidoAt?: Date | null;
};

export interface CadastroComplementarRepository {
  findByAgenciaId(agenciaId: string): Promise<CadastroComplementar | null>;
  create(data: CreateCadastroComplementarData): Promise<CadastroComplementar>;
  update(agenciaId: string, data: UpdateCadastroComplementarData): Promise<CadastroComplementar>;
}
