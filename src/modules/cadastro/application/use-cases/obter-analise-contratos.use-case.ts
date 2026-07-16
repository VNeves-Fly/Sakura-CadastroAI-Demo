import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  AgenciaRepository,
  AnaliseContratos,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

// Painel de análise (IA x atendimento humano, contratos por dia,
// assinados x pendentes) — só dado real, contado a partir da tabela
// Contrato. Sem estimativa/projeção.
export class ObterAnaliseContratosUseCase implements UseCase<number, AnaliseContratos> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(dias: number): Promise<AnaliseContratos> {
    return this.agenciaRepository.obterAnaliseContratos(dias);
  }
}
