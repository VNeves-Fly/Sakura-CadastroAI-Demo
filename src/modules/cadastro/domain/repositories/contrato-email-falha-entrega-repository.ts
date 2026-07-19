import type { ContratoEmailFalhaEntrega } from "@/modules/cadastro/domain/entities/contrato-email-falha-entrega.entity";

export interface ContratoEmailFalhaEntregaRepository {
  // Idempotente (upsert por contratoId+email) — o D4Sign reenvia o mesmo
  // webhook em retries, não queremos duplicar o registro.
  registrar(contratoId: string, email: string, motivo: string | null): Promise<void>;
  findByContratoId(contratoId: string): Promise<ContratoEmailFalhaEntrega[]>;
}
