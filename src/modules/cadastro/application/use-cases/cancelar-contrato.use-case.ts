import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  CONTRATO_PROVEDOR_ID_PENDENTE,
  CONTRATO_STATUS_CANCELADO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface CancelarContratoInput {
  agenciaId: string;
  justificativa: string;
  canceladoPor: string;
}

// Etapas em que existe um contrato "em andamento" pra cancelar — antes
// disso (em_complementar) não há contrato ativo; depois (aguardando_
// cadastramento em diante) o time de cadastro já validou as evidências, e
// cancelar deixaria de fazer sentido nesse ponto do fluxo (decisão do
// usuário, 2026-07-31).
const ETAPAS_COM_CONTRATO_CANCELAVEL = new Set<string>([
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
]);

// Ação do analista: desiste do contrato atual (dados errados, sócio pediu
// pra recomeçar etc.) e devolve o cadastro pra complementar. Cancela no
// D4Sign primeiro — só depois marca o Contrato local como cancelado, pra
// nunca deixar um documento ainda ativo lá fora enquanto aqui já mostra
// cancelado. Contratos-placeholder (checkbox "gerar contrato
// automaticamente" desmarcado, ver AprovarCadastroComplementarUseCase)
// nunca chegam ao D4Sign, então pulam essa chamada. Se uma nova aprovação
// acontecer depois, AprovarCadastroComplementarUseCase cria um Contrato
// NOVO — este registro cancelado fica só como histórico.
export class CancelarContratoUseCase implements UseCase<CancelarContratoInput, Agencia> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
    private readonly historicoEdicaoCadastroRepository: HistoricoEdicaoCadastroRepository,
  ) {}

  async execute(input: CancelarContratoInput): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(input.agenciaId);
    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    const statusAtual = detalhe.agencia.status;
    if (!ETAPAS_COM_CONTRATO_CANCELAVEL.has(statusAtual)) {
      throw new ConflictError("Este cadastro não está numa etapa com contrato cancelável.");
    }

    const justificativa = input.justificativa.trim();
    if (justificativa.length === 0) {
      throw new DomainError("Informe a justificativa do cancelamento.");
    }

    const contratoAtual = detalhe.contratos[0];
    if (!contratoAtual) {
      throw new ConflictError("Nenhum contrato encontrado pra esta agência.");
    }

    if (contratoAtual.provedorId !== CONTRATO_PROVEDOR_ID_PENDENTE) {
      await this.contratoAssinaturaService.cancelarDocumento(
        contratoAtual.provedorId,
        justificativa,
      );
    }

    await this.agenciaRepository.atualizarStatusContrato(
      contratoAtual.id,
      CONTRATO_STATUS_CANCELADO,
    );
    const agencia = await this.agenciaRepository.atualizarStatus(
      input.agenciaId,
      STATUS_EM_COMPLEMENTAR,
    );

    await this.historicoEdicaoCadastroRepository.create({
      agenciaId: input.agenciaId,
      entidade: "Agencia",
      entidadeId: input.agenciaId,
      alteracoes: { status: { de: statusAtual, para: STATUS_EM_COMPLEMENTAR } },
      justificativa,
      editadoPor: input.canceladoPor,
    });

    return agencia;
  }
}
