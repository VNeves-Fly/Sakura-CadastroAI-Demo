import type {
  AtendimentoAgenciaRepository,
  RegistroHistoricoAtendimentoAgencia,
} from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

export class ListarHistoricoAtendimentoAgenciaUseCase {
  constructor(private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository) {}

  execute(agenciaId: string): Promise<RegistroHistoricoAtendimentoAgencia[]> {
    return this.atendimentoAgenciaRepository.listarHistorico(agenciaId, 10);
  }
}
