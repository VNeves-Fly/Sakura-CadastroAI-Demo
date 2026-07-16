import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  AgenciaRepository,
  ListarCadastrosFiltros,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface ListarCadastrosOutput {
  items: Agencia[];
  total: number;
  kpis: {
    emAnalise: number;
    reprovadas: number;
    aprovadas: number;
    aguardandoAprovacaoFinal: number;
  };
  funil: {
    etapa1: number;
    etapa2: number;
    etapa3: number;
    etapa4: number;
  };
}

// Agrega os 3 dados que a tela de listagem do Admin precisa numa
// carga só (KPIs, funil de etapas e a tabela filtrada) — evita 3
// idas e voltas separadas do lado do front pra uma única página.
export class ListarCadastrosUseCase implements UseCase<
  ListarCadastrosFiltros,
  ListarCadastrosOutput
> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(filtros: ListarCadastrosFiltros): Promise<ListarCadastrosOutput> {
    // Sem filtro de etapa explícito (clique num card do funil), a
    // listagem mostra só a tab "Em Análise" (etapas 1-4 = ativas) — a
    // única tab visível hoje, igual ao produto original.
    const filtrosEfetivos: ListarCadastrosFiltros = {
      ...filtros,
      etapa: filtros.etapa ?? [1, 2, 3, 4],
    };

    const [{ items, total }, kpis, funil] = await Promise.all([
      this.agenciaRepository.listar(filtrosEfetivos),
      this.agenciaRepository.obterKpis(),
      this.agenciaRepository.obterFunil(),
    ]);

    return { items, total, kpis, funil };
  }
}
