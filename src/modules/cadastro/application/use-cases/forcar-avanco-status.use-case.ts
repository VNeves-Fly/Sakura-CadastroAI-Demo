import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface ForcarAvancoStatusInput {
  agenciaId: string;
  justificativa: string;
  forcadoPor: string;
}

// As duas transições que hoje só acontecem via webhook do D4Sign (todos os
// sócios assinaram; aprovador assinou com a validação pendente) — via de
// escape auditada pra quando a plataforma não conseguir fazer isso sozinha
// (webhook perdido, problema no D4Sign etc.). Mapeia o status ATUAL pro
// destino — o botão "Forçar avanço" na UI é o mesmo nas duas etapas, o
// use-case decide o destino sozinho.
const PROXIMO_STATUS_FORCAVEL: Record<string, string | undefined> = {
  [STATUS_AGUARDANDO_ASSINATURA]: STATUS_AGUARDANDO_VALIDACAO,
  [STATUS_AGUARDANDO_VALIDACAO]: STATUS_AGUARDANDO_CADASTRAMENTO,
};

// Mesmo padrão de "quem/quando/por quê" já usado em
// RemoverRepresentanteLegalUseCase/EditarDadosEmpresaUseCase — reaproveita
// HistoricoEdicaoCadastroRepository em vez de uma tabela de auditoria nova.
export class ForcarAvancoStatusUseCase implements UseCase<ForcarAvancoStatusInput, Agencia> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly historicoEdicaoCadastroRepository: HistoricoEdicaoCadastroRepository,
  ) {}

  async execute(input: ForcarAvancoStatusInput): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(input.agenciaId);
    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    const statusAtual = detalhe.agencia.status;
    const statusDestino = PROXIMO_STATUS_FORCAVEL[statusAtual];
    if (!statusDestino) {
      throw new ConflictError(
        "Este cadastro não está numa etapa com avanço automático que possa ser forçado.",
      );
    }

    if (input.justificativa.trim().length === 0) {
      throw new DomainError("Informe a justificativa do avanço forçado.");
    }

    const justificativa = input.justificativa.trim();
    const agencia = await this.agenciaRepository.atualizarStatus(input.agenciaId, statusDestino, {
      usuarioEmail: input.forcadoPor,
      origem: "usuario",
      observacao: justificativa,
      desbloqueioManual: true,
    });

    await this.historicoEdicaoCadastroRepository.create({
      agenciaId: input.agenciaId,
      entidade: "Agencia",
      entidadeId: input.agenciaId,
      alteracoes: { status: { de: statusAtual, para: statusDestino } },
      justificativa,
      editadoPor: input.forcadoPor,
    });

    return agencia;
  }
}
