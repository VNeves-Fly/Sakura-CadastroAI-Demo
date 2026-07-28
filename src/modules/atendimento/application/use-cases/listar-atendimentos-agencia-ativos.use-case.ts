import type {
  AtendimentoAgenciaRepository,
  RegistroAtendimentoAgenciaAtivo,
} from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

export class ListarAtendimentosAgenciaAtivosUseCase {
  constructor(private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository) {}

  execute(agenciaIds: string[]): Promise<RegistroAtendimentoAgenciaAtivo[]> {
    return this.atendimentoAgenciaRepository.listarAtivosPorAgencias(agenciaIds);
  }
}
