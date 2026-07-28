import type {
  AssumirAtendimentoRepository,
  RegistroAtendimentoEncerradoPorAgencia,
} from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";

export class ListarUltimoAtendimentoEncerradoPorAgenciasUseCase {
  constructor(private readonly assumirAtendimentoRepository: AssumirAtendimentoRepository) {}

  execute(agenciaIds: string[]): Promise<RegistroAtendimentoEncerradoPorAgencia[]> {
    return this.assumirAtendimentoRepository.listarUltimoEncerradoPorAgencias(agenciaIds);
  }
}
