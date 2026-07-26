import type {
  AlteracaoCampo,
  EntidadeHistoricoEdicao,
  HistoricoEdicaoCadastro,
} from "@/modules/cadastro/domain/entities/historico-edicao-cadastro.entity";

export interface CreateHistoricoEdicaoCadastroData {
  agenciaId: string;
  entidade: EntidadeHistoricoEdicao;
  entidadeId: string;
  alteracoes: Record<string, AlteracaoCampo>;
  justificativa: string;
  editadoPor: string;
}

export interface HistoricoEdicaoCadastroRepository {
  create(data: CreateHistoricoEdicaoCadastroData): Promise<HistoricoEdicaoCadastro>;
  // Mais recente primeiro — usado tanto pelo card do sócio quanto pelo da
  // empresa pra listar o histórico de edições de uma entidade específica
  // (RepresentanteLegal.id, Agencia.id ou CadastroComplementar.id).
  findByEntidadeId(entidadeId: string): Promise<HistoricoEdicaoCadastro[]>;
}
