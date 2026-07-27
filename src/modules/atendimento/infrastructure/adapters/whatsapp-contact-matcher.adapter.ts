import type { PrismaClient } from "@prisma/client";
import { telefonesEquivalentes } from "@/modules/shared/utils/telefone.util";
import type {
  ContatoEncontrado,
  WhatsAppContactMatcher,
} from "@/modules/atendimento/domain/services/whatsapp-contact-matcher";

// Comparação feita em memória (sem coluna de telefone normalizado indexada
// ainda) — aceitável no volume atual de agências; se crescer muito, trocar
// por uma coluna derivada + índice.
export class WhatsAppContactMatcherAdapter implements WhatsAppContactMatcher {
  constructor(private readonly prisma: PrismaClient) {}

  async match(telefoneWhatsapp: string): Promise<ContatoEncontrado | null> {
    const [representantes, agencias, complementares] = await Promise.all([
      this.prisma.representanteLegal.findMany({
        where: { ativo: true },
        select: {
          id: true,
          agenciaId: true,
          nome: true,
          telefone: true,
          isRepresentanteLegal: true,
        },
      }),
      this.prisma.agencia.findMany({
        select: { id: true, razaoSocial: true, telefoneContato: true },
      }),
      this.prisma.cadastroComplementar.findMany({
        where: { telefoneComercial: { not: null } },
        select: {
          agenciaId: true,
          telefoneComercial: true,
          agencia: { select: { razaoSocial: true } },
        },
      }),
    ]);

    const representante = representantes.find((item) =>
      telefonesEquivalentes(item.telefone, telefoneWhatsapp),
    );
    if (representante) {
      return {
        agenciaId: representante.agenciaId,
        representanteLegalId: representante.id,
        membroNome: representante.nome,
        membroPapel: representante.isRepresentanteLegal ? "representante_legal" : "socio",
      };
    }

    const agencia = agencias.find((item) =>
      telefonesEquivalentes(item.telefoneContato, telefoneWhatsapp),
    );
    if (agencia) {
      return {
        agenciaId: agencia.id,
        representanteLegalId: null,
        membroNome: agencia.razaoSocial,
        membroPapel: "comercial",
      };
    }

    const complementar = complementares.find(
      (item) =>
        item.telefoneComercial && telefonesEquivalentes(item.telefoneComercial, telefoneWhatsapp),
    );
    if (complementar) {
      return {
        agenciaId: complementar.agenciaId,
        representanteLegalId: null,
        membroNome: complementar.agencia.razaoSocial,
        membroPapel: "comercial",
      };
    }

    return null;
  }
}
