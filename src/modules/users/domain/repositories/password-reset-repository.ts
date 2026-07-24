export type PasswordResetStatus = "PENDING" | "VERIFIED" | "USED";

export interface PasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  codigoHash: string;
  status: PasswordResetStatus;
  tentativas: number;
  verificadoEm: Date | null;
  usadoEm: Date | null;
  expiraEm: Date;
}

export interface CreatePasswordResetData {
  userId: string;
  tokenHash: string;
  codigoHash: string;
  expiraEm: Date;
}

export interface PasswordResetRepository {
  create(data: CreatePasswordResetData): Promise<PasswordResetRecord>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  // Incrementa tentativas de forma atômica (update com increment no banco)
  // e devolve o registro já com o valor novo — evita race condition de
  // ler/comparar/escrever entre requisições concorrentes.
  incrementAttempts(id: string): Promise<PasswordResetRecord>;
  markVerified(id: string): Promise<void>;
  markUsed(id: string): Promise<void>;
  // Remove tokens "ativos" (PENDING/VERIFIED, nunca USED) do usuário — só
  // um OTP pendente por vez, e chamado também por UserRepository.
  // updatePassword pra qualquer troca de senha (por outra via) invalidar
  // um OTP em aberto. Tokens USED nunca são apagados por aqui: preserva o
  // histórico de uso (usadoEm) e evita a corrida de apagar o próprio token
  // que ResetPasswordUseCase acabou de marcar como usado.
  deleteActiveByUserId(userId: string): Promise<void>;
}
