import type { ObservacaoCadastro } from "@/modules/cadastro/domain/entities/observacao-cadastro.entity";

export interface CreateObservacaoCadastroData {
  agenciaId: string;
  texto: string;
  registradoPor: string;
}

export interface ObservacaoCadastroRepository {
  create(data: CreateObservacaoCadastroData): Promise<ObservacaoCadastro>;
  // Mais recente primeiro — mesma convenção de HistoricoEdicaoCadastroRepository.
  findByAgenciaId(agenciaId: string): Promise<ObservacaoCadastro[]>;
}
