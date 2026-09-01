import type { UseCase } from "@/modules/shared/application/use-case";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_ATIVO,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
  type HistoricoEtapaCadastroItem,
  type SeriesMovimentacao,
  type SlaEtapaItem,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

const DIAS_NOVOS_CADASTROS = 30;
// A tela principal só mostra os 5 mais recentes (ver
// UltimasMovimentacoesList); pra ver mais, o modal "Ver mais" busca via
// listarUltimasMovimentacoesEtapaPaginado, não deste use case.
const LIMITE_ULTIMAS_MOVIMENTACOES = 5;

export interface DashboardMetricas {
  novosCadastros30Dias: number;
  slaPorEtapa: SlaEtapaItem[];
  ultimasMovimentacoes: HistoricoEtapaCadastroItem[];
  // Séries pro seletor DIA/MÊS/ANO dos cards de KPI (ver
  // DashboardKpiCard/DashboardKpisGrid) — cada uma conta linhas de
  // HistoricoEtapaCadastro com o mesmo filtro que define a métrica do
  // card correspondente.
  seriesNovosCadastros: SeriesMovimentacao;
  seriesContratosIa: SeriesMovimentacao;
  seriesEmComplementar: SeriesMovimentacao;
  seriesAtivas: SeriesMovimentacao;
}

// Agrega tudo que a /dashboard precisa numa carga só (mesmo espírito de
// ListarCadastrosUseCase pra listagem+KPIs) — quase tudo vem do histórico
// de transições de etapa (ver HistoricoEtapaCadastro).
export class ObterMetricasDashboardUseCase implements UseCase<void, DashboardMetricas> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(): Promise<DashboardMetricas> {
    const desde = new Date();
    desde.setDate(desde.getDate() - DIAS_NOVOS_CADASTROS);

    const [
      novosCadastros30Dias,
      slaPorEtapa,
      ultimasMovimentacoes,
      seriesNovosCadastros,
      seriesContratosIa,
      seriesEmComplementar,
      seriesAtivas,
    ] = await Promise.all([
      this.agenciaRepository.contarNovosCadastros(desde),
      this.agenciaRepository.calcularSlaPorEtapa(),
      this.agenciaRepository.listarUltimasMovimentacoesEtapa(LIMITE_ULTIMAS_MOVIMENTACOES),
      this.agenciaRepository.listarSeriesMovimentacoes({ apenasCriacao: true }),
      // statusNovo=aguardando_assinatura + origem=ia é exatamente "contrato
      // gerado automaticamente pela IA" (ver registrarAnaliseFinal, que só
      // grava origem "ia" nesse caminho).
      this.agenciaRepository.listarSeriesMovimentacoes({
        statusNovo: STATUS_AGUARDANDO_ASSINATURA,
        origem: "ia",
      }),
      this.agenciaRepository.listarSeriesMovimentacoes({ statusNovo: STATUS_EM_COMPLEMENTAR }),
      this.agenciaRepository.listarSeriesMovimentacoes({ statusNovo: STATUS_ATIVO }),
    ]);

    return {
      novosCadastros30Dias,
      slaPorEtapa,
      ultimasMovimentacoes,
      seriesNovosCadastros,
      seriesContratosIa,
      seriesEmComplementar,
      seriesAtivas,
    };
  }
}
