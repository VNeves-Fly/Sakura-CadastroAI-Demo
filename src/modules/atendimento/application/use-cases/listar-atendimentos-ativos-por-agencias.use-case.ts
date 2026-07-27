import type {
  AssumirAtendimentoRepository,
  RegistroAtendimentoAtivoPorAgencia,
} from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";

export class ListarAtendimentosAtivosPorAgenciasUseCase {
  constructor(private readonly assumirAtendimentoRepository: AssumirAtendimentoRepository) {}

  execute(agenciaIds: string[]): Promise<RegistroAtendimentoAtivoPorAgencia[]> {
    return this.assumirAtendimentoRepository.listarAtivosPorAgencias(agenciaIds);
  }
}
