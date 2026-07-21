import type {
  DadosReceita,
  DadosReceitaEndereco,
  DadosReceitaCnae,
} from "@/modules/cadastro/domain/entities/dados-receita.entity";

export interface CreateDadosReceitaData {
  agenciaId: string;
  situacaoCadastral?: string | null;
  dataAbertura?: Date | null;
  naturezaJuridica?: string | null;
  porte?: string | null;
  capitalSocial?: number | null;
  telefone?: string | null;
  email?: string | null;
  optanteSimples?: boolean;
  dataOpcaoSimples?: Date | null;
  endereco?: DadosReceitaEndereco | null;
  cnaes?: DadosReceitaCnae[];
}

export type UpdateDadosReceitaData = Partial<Omit<CreateDadosReceitaData, "agenciaId">>;

export interface DadosReceitaRepository {
  findByAgenciaId(agenciaId: string): Promise<DadosReceita | null>;
  create(data: CreateDadosReceitaData): Promise<DadosReceita>;
  update(agenciaId: string, data: UpdateDadosReceitaData): Promise<DadosReceita>;
}
