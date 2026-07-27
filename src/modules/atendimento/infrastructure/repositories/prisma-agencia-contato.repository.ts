import type { PrismaClient } from "@prisma/client";
import {
  deduplicarOpcoesTelefone,
  telefonesEquivalentes,
  unmaskTelefone,
} from "@/modules/shared/utils/telefone.util";
import type {
  ContatoAgenciaEntity,
  NumeroContatoEntity,
} from "@/modules/atendimento/domain/entities/contato-agencia.entity";
import type { PapelMembroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AgenciaContatoRepository } from "@/modules/atendimento/domain/repositories/agencia-contato-repository";

const SELECT_CONTATO = {
  id: true,
  razaoSocial: true,
  cnpj: true,
  telefoneContato: true,
  complementar: { select: { telefoneComercial: true } },
  representantesLegais: {
    where: { ativo: true },
    select: { id: true, nome: true, telefone: true, isRepresentanteLegal: true },
  },
  conversas: { select: { id: true, telefoneWhatsapp: true } },
} as const;

type AgenciaContatoRecord = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  telefoneContato: string;
  complementar: { telefoneComercial: string | null } | null;
  representantesLegais: {
    id: string;
    nome: string;
    telefone: string;
    isRepresentanteLegal: boolean;
  }[];
  conversas: { id: string; telefoneWhatsapp: string }[];
};

// Fonte de dados da lista de Contatos e do modal "com quem falar" — mesmas
// 3 fontes de telefone que WhatsAppContactMatcherAdapter usa (telefone →
// contato), aqui no caminho inverso (agência → telefones candidatos),
// mesma ideia de montarOpcoesAtendimento (dossiê), só que consultando o
// Prisma direto em vez de receber os dados já carregados.
export class PrismaAgenciaContatoRepository implements AgenciaContatoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(busca?: string): Promise<ContatoAgenciaEntity[]> {
    const termo = busca?.trim();
    const digitos = termo ? unmaskTelefone(termo) : "";

    const agencias = await this.prisma.agencia.findMany({
      where: termo
        ? {
            OR: [
              { razaoSocial: { contains: termo, mode: "insensitive" } },
              ...(digitos ? [{ cnpj: { contains: digitos } }] : []),
            ],
          }
        : undefined,
      orderBy: { razaoSocial: "asc" },
      select: SELECT_CONTATO,
    });

    return agencias.map((agencia) => this.paraEntity(agencia));
  }

  async obterPorAgenciaId(agenciaId: string): Promise<ContatoAgenciaEntity | null> {
    const agencia = await this.prisma.agencia.findUnique({
      where: { id: agenciaId },
      select: SELECT_CONTATO,
    });
    return agencia ? this.paraEntity(agencia) : null;
  }

  private paraEntity(agencia: AgenciaContatoRecord): ContatoAgenciaEntity {
    const candidatos: Omit<NumeroContatoEntity, "agenciaId" | "conversaId">[] = [
      {
        label: "Comercial",
        telefone: agencia.telefoneContato,
        papel: "comercial",
        representanteLegalId: null,
      },
      ...(agencia.complementar?.telefoneComercial
        ? [
            {
              label: "Comercial",
              telefone: agencia.complementar.telefoneComercial,
              papel: "comercial" as PapelMembroEntity,
              representanteLegalId: null,
            },
          ]
        : []),
      ...agencia.representantesLegais.map((socio) => ({
        label: socio.nome,
        telefone: socio.telefone,
        papel: (socio.isRepresentanteLegal ? "representante_legal" : "socio") as PapelMembroEntity,
        representanteLegalId: socio.id,
      })),
    ];

    const numeros: NumeroContatoEntity[] = deduplicarOpcoesTelefone(candidatos).map((candidato) => {
      const conversa = agencia.conversas.find((item) =>
        telefonesEquivalentes(item.telefoneWhatsapp, candidato.telefone),
      );
      return { ...candidato, agenciaId: agencia.id, conversaId: conversa?.id ?? null };
    });

    return {
      agenciaId: agencia.id,
      agenciaNome: agencia.razaoSocial,
      cnpj: agencia.cnpj,
      numeros,
    };
  }
}
