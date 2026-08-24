import type { EmailLog } from "@/modules/shared/domain/entities/email-log.entity";
import type { DisparoEmail } from "@/modules/shared/domain/enums";

export interface CreateEmailLogData {
  destinatario: string;
  assunto: string;
  corpo: string;
  origem: string;
  disparo: DisparoEmail;
  agenciaId?: string;
  sucesso: boolean;
  erro?: string;
}

export interface ListarEmailLogsFiltros {
  agenciaId?: string;
  destinatario?: string;
  disparo?: DisparoEmail;
  sucesso?: boolean;
  page: number;
  pageSize: number;
}

// Nome da agência já resolvido pro item da listagem — mesmo padrão de
// associacaoNome/executivoNome em ListarCadastrosItem (agencia-repository.ts):
// denormalizado só pra exibição, EmailLog em si não guarda isso.
export interface EmailLogListItem {
  log: EmailLog;
  agenciaRazaoSocial: string | null;
}

export interface EmailLogRepository {
  create(data: CreateEmailLogData): Promise<EmailLog>;
  listar(filtros: ListarEmailLogsFiltros): Promise<{ items: EmailLogListItem[]; total: number }>;
  findById(id: string): Promise<EmailLog | null>;
}
