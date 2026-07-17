import type { Endereco } from "@/modules/cadastro/domain/entities/endereco.entity";

// O dono é sempre exatamente um dos três ids abaixo — ver comentário em
// endereco.entity.ts e prisma/schema.md sobre o FK ficar do lado do
// Endereco.
export interface CreateEnderecoData {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  dadosReceitaId?: string | null;
  cadastroComplementarId?: string | null;
  representanteLegalId?: string | null;
}

export type UpdateEnderecoData = Partial<
  Omit<CreateEnderecoData, "dadosReceitaId" | "cadastroComplementarId" | "representanteLegalId">
>;

export interface EnderecoRepository {
  findById(id: string): Promise<Endereco | null>;
  findByDadosReceitaId(dadosReceitaId: string): Promise<Endereco | null>;
  findByCadastroComplementarId(cadastroComplementarId: string): Promise<Endereco | null>;
  findByRepresentanteLegalId(representanteLegalId: string): Promise<Endereco | null>;
  create(data: CreateEnderecoData): Promise<Endereco>;
  update(id: string, data: UpdateEnderecoData): Promise<Endereco>;
}
