import type { ContratoAssinatura } from "@/modules/cadastro/domain/entities/contrato-assinatura.entity";

export interface ContratoAssinaturaRepository {
  // Idempotente (upsert por contratoId+email) — o D4Sign reenvia o mesmo
  // webhook em retries. Diferente do registro de falha de entrega, o
  // retry NÃO sobrescreve o assinadoEm: a data da primeira gravação é a
  // que vale como momento da assinatura.
  registrar(contratoId: string, email: string): Promise<void>;
  findByContratoId(contratoId: string): Promise<ContratoAssinatura[]>;
}
