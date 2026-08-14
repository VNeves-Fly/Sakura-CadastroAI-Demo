import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  AgenciaRepository,
  CadastrosKpis,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

// Só os KPIs de fila (ver CadastrosKpis) — ListarCadastrosUseCase também
// busca isso, mas junto de uma listagem paginada inteira, cara demais pra
// telas (ex.: /dashboard) que só precisam dos números.
export class ObterKpisCadastroUseCase implements UseCase<void, CadastrosKpis> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(): Promise<CadastrosKpis> {
    return this.agenciaRepository.obterKpis();
  }
}
