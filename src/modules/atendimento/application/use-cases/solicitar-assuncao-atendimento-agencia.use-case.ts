import { ConflictError } from "@/modules/shared/domain/errors";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";
import type { SolicitacaoAtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-atendimento-agencia-repository";
import type { SolicitacaoAtendimentoAgenciaEntity } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";
import type { SolicitarAssuncaoAtendimentoAgenciaInput } from "@/modules/atendimento/application/dto/solicitar-assuncao-atendimento-agencia.dto";

// Substitui a antiga regra de "Puxar atendimento" (esperar HORAS_LIMITE_ASSUMIR
// de inatividade) — disponível imediatamente contra quem está atendendo
// agora, sem escolher destino (o destino é sempre o próprio solicitante, se
// aceito). solicitanteId === novoAtendenteId; atendenteAtualId é quem
// atende agora (será liberado se ACEITA).
export class SolicitarAssuncaoAtendimentoAgenciaUseCase {
  constructor(
    private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
    private readonly solicitacaoAtendimentoAgenciaRepository: SolicitacaoAtendimentoAgenciaRepository,
  ) {}

  async execute(
    input: SolicitarAssuncaoAtendimentoAgenciaInput,
  ): Promise<SolicitacaoAtendimentoAgenciaEntity> {
    const atual = await this.atendimentoAgenciaRepository.findAtual(input.agenciaId);
    if (!atual) {
      throw new ConflictError("Ninguém está atendendo esta agência — use Iniciar atendimento.");
    }
    if (atual.analistaId === input.solicitanteId) {
      throw new ConflictError("Você já está atendendo esta agência.");
    }

    const pendente = await this.solicitacaoAtendimentoAgenciaRepository.findPendentePorAgencia(
      input.agenciaId,
    );
    if (pendente) {
      throw new ConflictError(
        "Já existe uma solicitação de atendimento pendente pra esta agência.",
      );
    }

    return this.solicitacaoAtendimentoAgenciaRepository.criar({
      agenciaId: input.agenciaId,
      tipo: "assuncao",
      solicitanteId: input.solicitanteId,
      atendenteAtualId: atual.analistaId,
      novoAtendenteId: input.solicitanteId,
    });
  }
}
