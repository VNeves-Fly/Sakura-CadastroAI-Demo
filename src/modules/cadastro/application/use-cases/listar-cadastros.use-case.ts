import type { UseCase } from "@/modules/shared/application/use-case";
import {
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
  type CadastrosKpis,
  type ListarCadastrosFiltros,
  type ListarCadastrosItem,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface ListarCadastrosOutput {
  items: ListarCadastrosItem[];
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
    // listagem mostra as filas que ainda precisam de ação do analista —
    // "em_complementar", "aguardando_validacao" e "aguardando_ativacao".
    // "aguardando_assinatura" fica de fora do default porque é só
    // informativo (nada a fazer até o sócio assinar); "ativo"/"recusado"
    // são estados finais.
    const filtrosEfetivos: ListarCadastrosFiltros = {
      ...filtros,
      status: filtros.status ?? [
        STATUS_EM_COMPLEMENTAR,
        STATUS_AGUARDANDO_VALIDACAO,
        STATUS_AGUARDANDO_ATIVACAO,
      ],
    };

    const [{ items, total }, kpis] = await Promise.all([
      this.agenciaRepository.listar(filtrosEfetivos),
      this.agenciaRepository.obterKpis(),
    ]);

    return { items, total, kpis };
  }
}
