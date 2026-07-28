import type {
  AtendimentoAgenciaRepository,
  RegistroAtendimentoAgenciaEncerrado,
} from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

export class ListarUltimoAtendimentoAgenciaEncerradoUseCase {
  constructor(private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository) {}

  execute(agenciaIds: string[]): Promise<RegistroAtendimentoAgenciaEncerrado[]> {
    return this.atendimentoAgenciaRepository.listarUltimoEncerradoPorAgencias(agenciaIds);
  }
}
