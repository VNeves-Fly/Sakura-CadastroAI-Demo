import type { UseCase } from "@/modules/shared/application/use-case";
import {
  STATUS_EM_ANALISE,
  STATUS_AGUARDANDO_ASSINATURA,
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
    // listagem mostra todo cadastro em andamento — só exclui os dois
    // estados finais (ativo/recusado, ver Ciclo de vida completo da
    // agência no topo de agencia-repository.ts). Decisão do usuário
    // (2026-07-27): antes o default era uma lista fechada de 3-4 filas
    // "que precisam de ação", o que escondia silenciosamente qualquer
    // status fora dessa lista (ex.: aguardando_assinatura, depois
    // em_analise) sem nenhum aviso — nenhum card de fila aparece "ativo"
    // quando não há status na URL, então parecia estar mostrando tudo sem
    // realmente mostrar.
    const filtrosEfetivos: ListarCadastrosFiltros = {
      ...filtros,
      status: filtros.status ?? [
        STATUS_EM_ANALISE,
        STATUS_EM_COMPLEMENTAR,
        STATUS_AGUARDANDO_ASSINATURA,
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
