import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import {
  STATUS_AGUARDANDO_ATIVACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface ConfirmarCadastramentoInput {
  agenciaId: string;
}

// Transição aguardando_cadastramento -> aguardando_ativacao (botão
// "Confirmar Cadastramento", ValidacaoSicaTravelLink) — exige código SICA
// salvo E a empresa ativa no SICA na consulta mais recente ao SST (ver
// ConsultaSst). Antes disso era um atualizarStatus puro, sem nenhuma
// validação de backend (o gate vivia só no `disabled` do botão no client) —
// trava real adicionada aqui, decisão do usuário, 2026-08-05.
export class ConfirmarCadastramentoUseCase implements UseCase<
  ConfirmarCadastramentoInput,
  Agencia
> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute({ agenciaId }: ConfirmarCadastramentoInput): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(agenciaId);
    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    if (!detalhe.agencia.sicaCodigo) {
      throw new DomainError("Salve o código SICA antes de confirmar o cadastramento.");
    }

    const consultaAtual = detalhe.consultasSst.find((item) => item.sucesso);
    if (!consultaAtual?.encontrado || consultaAtual.empresaStatus !== "ativo") {
      throw new DomainError(
        "A empresa não está ativa no SICA — clique em Atualizar e confirme antes de avançar.",
      );
    }

    return this.agenciaRepository.atualizarStatus(agenciaId, STATUS_AGUARDANDO_ATIVACAO);
  }
}
