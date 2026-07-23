import type { PrismaClient } from "@prisma/client";
import { unmaskTelefone } from "@/modules/shared/utils/telefone.util";
import type {
  ContatoEncontrado,
  WhatsAppContactMatcher,
} from "@/modules/atendimento/domain/services/whatsapp-contact-matcher";

// Candidatos de variação do número local — cobre o 9º dígito do celular
// brasileiro, que a Meta às vezes inclui/omite de forma inconsistente
// dependendo da operadora/registro legado.
function variantesLocais(localDigits: string): string[] {
  if (localDigits.length === 11) {
    return [localDigits, localDigits.slice(0, 2) + localDigits.slice(3)];
  }
  if (localDigits.length === 10) {
    return [localDigits, `${localDigits.slice(0, 2)}9${localDigits.slice(2)}`];
  }
  return [localDigits];
}

function candidatosParaComparar(telefoneWhatsapp: string): Set<string> {
  const digits = telefoneWhatsapp.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  return new Set(variantesLocais(local));
}

function bate(telefoneArmazenado: string, candidatos: Set<string>): boolean {
  const digitsArmazenados = unmaskTelefone(telefoneArmazenado);
  const local = digitsArmazenados.startsWith("55") ? digitsArmazenados.slice(2) : digitsArmazenados;
  return variantesLocais(local).some((variante) => candidatos.has(variante));
}

// Comparação feita em memória (sem coluna de telefone normalizado indexada
// ainda) — aceitável no volume atual de agências; se crescer muito, trocar
// por uma coluna derivada + índice.
export class WhatsAppContactMatcherAdapter implements WhatsAppContactMatcher {
  constructor(private readonly prisma: PrismaClient) {}

  async match(telefoneWhatsapp: string): Promise<ContatoEncontrado | null> {
    const candidatos = candidatosParaComparar(telefoneWhatsapp);

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

    const representante = representantes.find((item) => bate(item.telefone, candidatos));
    if (representante) {
      return {
        agenciaId: representante.agenciaId,
        representanteLegalId: representante.id,
        membroNome: representante.nome,
        membroPapel: representante.isRepresentanteLegal ? "representante_legal" : "socio",
      };
    }

    const agencia = agencias.find((item) => bate(item.telefoneContato, candidatos));
    if (agencia) {
      return {
        agenciaId: agencia.id,
        representanteLegalId: null,
        membroNome: agencia.razaoSocial,
        membroPapel: "comercial",
      };
    }

    const complementar = complementares.find(
      (item) => item.telefoneComercial && bate(item.telefoneComercial, candidatos),
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
