import type { BiometriaVerificacao } from "@/modules/cadastro/domain/entities/biometria-verificacao.entity";
import type { StatusBiometriaVerificacao } from "@/modules/cadastro/domain/enums";

export interface CriarBiometriaVerificacaoInput {
  contratoId: string;
  agenciaId: string;
  email: string;
  cpf: string;
  token: string;
  sessionId: string | null;
  personId: string | null;
  legitimuzUrl: string | null;
  legitimuzUrlQrCode: string | null;
  expiraEm: Date;
}

export interface BiometriaVerificacaoRepository {
  // Upsert por contratoId+email — reenvio (manual ou pelo cron de
  // lembrete) gera um token novo pro mesmo sócio em vez de duplicar linha,
  // e reseta o status pra "pendente".
  criarOuSubstituir(input: CriarBiometriaVerificacaoInput): Promise<BiometriaVerificacao>;
  buscarPorToken(token: string): Promise<BiometriaVerificacao | null>;
  buscarPorContratoIdEEmail(
    contratoId: string,
    email: string,
  ): Promise<BiometriaVerificacao | null>;
  findByContratoId(contratoId: string): Promise<BiometriaVerificacao[]>;
  atualizarStatus(
    id: string,
    status: StatusBiometriaVerificacao,
    resolvidoEm: Date | null,
  ): Promise<void>;
  incrementarTentativasLembrete(id: string): Promise<void>;
}
