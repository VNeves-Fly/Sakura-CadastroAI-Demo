import type { UseCase } from "@/modules/shared/application/use-case";
import {
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
  type CadastrosKpis,
  type ListarCadastrosFiltros,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface ListarCadastrosOutput {
  items: Agencia[];
  total: number;
  kpis: CadastrosKpis;
}

// Agrega os 2 dados que a tela de listagem do Admin precisa numa carga
// só (KPIs das filas + a tabela filtrada) — evita idas e voltas
// separadas do lado do front pra uma única página.
export class ListarCadastrosUseCase implements UseCase<
  ListarCadastrosFiltros,
  ListarCadastrosOutput
> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(filtros: ListarCadastrosFiltros): Promise<ListarCadastrosOutput> {
    // Sem filtro de status explícito (clique num card de fila), a
    // listagem mostra as duas filas que ainda precisam de atenção —
    // "em_complementar" e "aguardando_validacao". "aguardando_assinatura"
    // fica de fora do default porque é só informativo (nada a fazer até
    // o sócio assinar); "ativo"/"recusado" são estados finais.
    const filtrosEfetivos: ListarCadastrosFiltros = {
      ...filtros,
      status: filtros.status ?? [STATUS_EM_COMPLEMENTAR, STATUS_AGUARDANDO_VALIDACAO],
    };

    const [{ items, total }, kpis] = await Promise.all([
      this.agenciaRepository.listar(filtrosEfetivos),
      this.agenciaRepository.obterKpis(),
    ]);

    return { items, total, kpis };
  }
}
