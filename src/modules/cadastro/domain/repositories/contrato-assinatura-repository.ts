import type { ContratoAssinatura } from "@/modules/cadastro/domain/entities/contrato-assinatura.entity";

export interface ContratoPendenteGestor {
  contratoId: string;
  agenciaId: string;
  razaoSocial: string;
}

export interface ContratoAssinaturaRepository {
  // Idempotente (upsert por contratoId+email) — chamado quando alguém
  // assina de verdade (D4Sign reenvia o mesmo webhook em retries). O
  // retry NÃO sobrescreve o assinadoEm já gravado: a data da primeira
  // assinatura é a que vale. `keySigner`, se passado, é sempre atualizado
  // (não muda depois de atribuído pelo D4Sign, mas não custa manter fresco).
  registrar(contratoId: string, email: string, keySigner?: string | null): Promise<void>;
  // Upsert de "destinatário conhecido" SEM marcar assinatura — usado pelo
  // sync manual pra guardar o keySigner de quem o D4Sign já lista mas
  // ainda não assinou (o key_signer é atribuído desde o createlist, antes
  // de qualquer assinatura). Nunca seta/mexe em assinadoEm.
  registrarDestinatario(contratoId: string, email: string, keySigner: string | null): Promise<void>;
  findByContratoId(contratoId: string): Promise<ContratoAssinatura[]>;
  // Sinaliza (sem apagar) que esse destinatário sumiu da lista do D4Sign —
  // só tem efeito se a linha já existir (updateMany, não upsert: gente que
  // nunca foi vista não tem o que marcar). `removido: false` limpa a marca
  // se a pessoa reaparecer.
  marcarRemocaoDoDocumento(contratoId: string, email: string, removido: boolean): Promise<void>;
  // Tela "Contratos pendentes de assinatura" dos gestores da Sakura (ver
  // docs/legitimuz/) — contratos onde esse e-mail é um destinatário
  // conhecido (ContratoAssinatura) mas ainda sem assinadoEm.
  findPendentesPorEmail(email: string): Promise<ContratoPendenteGestor[]>;
}
