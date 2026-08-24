import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  EmailLogListItem,
  EmailLogRepository,
  ListarEmailLogsFiltros as RepositoryFiltros,
} from "@/modules/shared/domain/repositories/email-log-repository";

export type ListarEmailLogsFiltros = RepositoryFiltros;

export interface ListarEmailLogsOutput {
  items: EmailLogListItem[];
  total: number;
}

// Tela "Logs de e-mail" (admin) — lista todo envio registrado por
// LoggingEmailSender, mais recente primeiro (ver PrismaEmailLogRepository).
export class ListarEmailLogsUseCase implements UseCase<
  ListarEmailLogsFiltros,
  ListarEmailLogsOutput
> {
  constructor(private readonly emailLogRepository: EmailLogRepository) {}

  execute(filtros: ListarEmailLogsFiltros): Promise<ListarEmailLogsOutput> {
    return this.emailLogRepository.listar(filtros);
  }
}
