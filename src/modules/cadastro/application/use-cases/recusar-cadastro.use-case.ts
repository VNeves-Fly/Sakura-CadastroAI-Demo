import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  STATUS_RECUSADO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface RecusarCadastroInput {
  agenciaId: string;
  motivo: string;
  recusadoPor: string;
}

// Mesmo padrão de "quem/quando/por quê" de CancelarContratoUseCase/
// ForcarAvancoStatusUseCase — reaproveita HistoricoEdicaoCadastroRepository
// em vez de criar uma tabela de auditoria nova só pra recusa.
export class RecusarCadastroUseCase implements UseCase<RecusarCadastroInput, Agencia> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly historicoEdicaoCadastroRepository: HistoricoEdicaoCadastroRepository,
  ) {}

  async execute(input: RecusarCadastroInput): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(input.agenciaId);
    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    const motivo = input.motivo.trim();
    if (motivo.length === 0) {
      throw new DomainError("Informe o motivo da recusa.");
    }

    const statusAtual = detalhe.agencia.status;
    const agencia = await this.agenciaRepository.atualizarStatus(input.agenciaId, STATUS_RECUSADO, {
      usuarioEmail: input.recusadoPor,
      origem: "usuario",
      observacao: motivo,
    });

    await this.historicoEdicaoCadastroRepository.create({
      agenciaId: input.agenciaId,
      entidade: "Agencia",
      entidadeId: input.agenciaId,
      alteracoes: { status: { de: statusAtual, para: STATUS_RECUSADO } },
      justificativa: motivo,
      editadoPor: input.recusadoPor,
    });

    return agencia;
  }
}
