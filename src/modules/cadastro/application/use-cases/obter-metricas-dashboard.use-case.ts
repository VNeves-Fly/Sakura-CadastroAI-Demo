import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  AgenciaRepository,
  HistoricoEtapaCadastroItem,
  SlaEtapaItem,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

const DIAS_NOVOS_CADASTROS = 30;
const LIMITE_ULTIMAS_MOVIMENTACOES = 15;

export interface DashboardMetricas {
  novosCadastros30Dias: number;
  slaPorEtapa: SlaEtapaItem[];
  ultimasMovimentacoes: HistoricoEtapaCadastroItem[];
}

// Agrega os 3 dados novos que a /dashboard precisa numa carga só (mesmo
// espírito de ListarCadastrosUseCase pra listagem+KPIs) — todos vêm do
// histórico de transições de etapa (ver HistoricoEtapaCadastro).
export class ObterMetricasDashboardUseCase implements UseCase<void, DashboardMetricas> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(): Promise<DashboardMetricas> {
    const desde = new Date();
    desde.setDate(desde.getDate() - DIAS_NOVOS_CADASTROS);

    const [novosCadastros30Dias, slaPorEtapa, ultimasMovimentacoes] = await Promise.all([
      this.agenciaRepository.contarNovosCadastros(desde),
      this.agenciaRepository.calcularSlaPorEtapa(),
      this.agenciaRepository.listarUltimasMovimentacoesEtapa(LIMITE_ULTIMAS_MOVIMENTACOES),
    ]);

    return { novosCadastros30Dias, slaPorEtapa, ultimasMovimentacoes };
  }
}
