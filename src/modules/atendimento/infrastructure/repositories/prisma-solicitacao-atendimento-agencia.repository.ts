import {
  Prisma,
  StatusSolicitacaoAtendimentoAgencia,
  TipoSolicitacaoAtendimentoAgencia,
  type PrismaClient,
} from "@prisma/client";
import { ConflictError } from "@/modules/shared/domain/errors";
import { TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS } from "@/modules/atendimento/domain/atendimento.constants";
import type {
  SolicitacaoAtendimentoAgenciaEntity,
  StatusSolicitacaoAtendimentoAgenciaEntity,
  TipoSolicitacaoAtendimentoAgenciaEntity,
} from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";
import type {
  CriarSolicitacaoAtendimentoAgenciaData,
  DecisaoSolicitacaoAtendimentoAgencia,
  SolicitacaoAtendimentoAgenciaRepository,
} from "@/modules/atendimento/domain/repositories/solicitacao-atendimento-agencia-repository";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

const TIPO_TO_PRISMA: Record<
  TipoSolicitacaoAtendimentoAgenciaEntity,
  TipoSolicitacaoAtendimentoAgencia
> = {
  transferencia: TipoSolicitacaoAtendimentoAgencia.TRANSFERENCIA,
  assuncao: TipoSolicitacaoAtendimentoAgencia.ASSUNCAO,
};

const TIPO_TO_ENTITY: Record<
  TipoSolicitacaoAtendimentoAgencia,
  TipoSolicitacaoAtendimentoAgenciaEntity
> = {
  TRANSFERENCIA: "transferencia",
  ASSUNCAO: "assuncao",
};

const STATUS_TO_ENTITY: Record<
  StatusSolicitacaoAtendimentoAgencia,
  StatusSolicitacaoAtendimentoAgenciaEntity
> = {
  PENDENTE: "pendente",
  ACEITA: "aceita",
  CANCELADA: "cancelada",
};

const INCLUDE_NOMES = {
  agencia: { select: { razaoSocial: true } },
  solicitante: { select: { name: true } },
  atendenteAtual: { select: { name: true } },
  novoAtendente: { select: { name: true } },
} as const;

type RegistroComRelacoes = Prisma.SolicitacaoAtendimentoAgenciaGetPayload<{
  include: typeof INCLUDE_NOMES;
}>;

export class PrismaSolicitacaoAtendimentoAgenciaRepository implements SolicitacaoAtendimentoAgenciaRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
  ) {}

  async criar(
    data: CriarSolicitacaoAtendimentoAgenciaData,
  ): Promise<SolicitacaoAtendimentoAgenciaEntity> {
    try {
      const record = await this.prisma.solicitacaoAtendimentoAgencia.create({
        data: {
          agenciaId: data.agenciaId,
          tipo: TIPO_TO_PRISMA[data.tipo],
          solicitanteId: data.solicitanteId,
          atendenteAtualId: data.atendenteAtualId,
          novoAtendenteId: data.novoAtendenteId,
        },
        include: INCLUDE_NOMES,
      });
      return this.toDomain(record);
    } catch (error) {
      // P2002 no índice único parcial (só 1 PENDENTE por agência) — corrida
      // de 2 pedidos quase simultâneos pra mesma agência.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Já existe uma solicitação pendente pra esta agência.");
      }
      throw error;
    }
  }

  async findPendentePorAgencia(
    agenciaId: string,
  ): Promise<SolicitacaoAtendimentoAgenciaEntity | null> {
    const record = await this.prisma.solicitacaoAtendimentoAgencia.findFirst({
      where: { agenciaId, status: StatusSolicitacaoAtendimentoAgencia.PENDENTE },
      include: INCLUDE_NOMES,
    });
    if (!record) return null;

    const expirou = await this.expirarSeVencida(record);
    if (expirou) return null;
    return this.toDomain(record);
  }

  async findPendentesEnvolvendoUsuario(
    userId: string,
  ): Promise<SolicitacaoAtendimentoAgenciaEntity[]> {
    const registros = await this.prisma.solicitacaoAtendimentoAgencia.findMany({
      where: {
        status: StatusSolicitacaoAtendimentoAgencia.PENDENTE,
        OR: [{ solicitanteId: userId }, { atendenteAtualId: userId }, { novoAtendenteId: userId }],
      },
      include: INCLUDE_NOMES,
    });

    const resultado: SolicitacaoAtendimentoAgenciaEntity[] = [];
    for (const record of registros) {
      const expirou = await this.expirarSeVencida(record);
      if (!expirou) resultado.push(this.toDomain(record));
    }
    return resultado;
  }

  async findById(id: string): Promise<SolicitacaoAtendimentoAgenciaEntity | null> {
    const record = await this.prisma.solicitacaoAtendimentoAgencia.findUnique({
      where: { id },
      include: INCLUDE_NOMES,
    });
    if (!record) return null;

    await this.expirarSeVencida(record);
    // Relê — expirarSeVencida pode ter mudado o status (auto-aceito).
    const atual = await this.prisma.solicitacaoAtendimentoAgencia.findUnique({
      where: { id },
      include: INCLUDE_NOMES,
    });
    return atual ? this.toDomain(atual) : null;
  }

  // Claim atômico via updateMany com guarda de status na WHERE: só quem
  // "ganha" a corrida (count === 1) executa o efeito de verdade. Cobre
  // duplo clique, confirmar depois que já expirou (auto-aceito por outra
  // leitura) e cancelar depois que já foi aceito.
  async resolver(
    id: string,
    decisao: DecisaoSolicitacaoAtendimentoAgencia,
  ): Promise<SolicitacaoAtendimentoAgenciaEntity> {
    const novoStatus =
      decisao === "ACEITAR"
        ? StatusSolicitacaoAtendimentoAgencia.ACEITA
        : StatusSolicitacaoAtendimentoAgencia.CANCELADA;

    const claim = await this.prisma.solicitacaoAtendimentoAgencia.updateMany({
      where: { id, status: StatusSolicitacaoAtendimentoAgencia.PENDENTE },
      data: { status: novoStatus, resolvidaEm: new Date() },
    });

    if (claim.count === 1) {
      const record = await this.prisma.solicitacaoAtendimentoAgencia.findUniqueOrThrow({
        where: { id },
        include: INCLUDE_NOMES,
      });
      if (decisao === "ACEITAR") {
        await this.efetivar(record.agenciaId, record.novoAtendenteId);
      }
      return this.toDomain(record);
    }

    // Perdi a corrida — outra chamada (confirmar/cancelar/expiração) já
    // resolveu antes. Devolvo o estado atual sem reaplicar nada, exceto
    // quando isso mentiria sobre o resultado pedido (cancelar algo já
    // efetivado, ou confirmar algo já cancelado).
    const atual = await this.prisma.solicitacaoAtendimentoAgencia.findUniqueOrThrow({
      where: { id },
      include: INCLUDE_NOMES,
    });
    if (decisao === "CANCELAR" && atual.status === StatusSolicitacaoAtendimentoAgencia.ACEITA) {
      throw new ConflictError("Este pedido já foi efetivado, não é possível cancelar.");
    }
    if (decisao === "ACEITAR" && atual.status === StatusSolicitacaoAtendimentoAgencia.CANCELADA) {
      throw new ConflictError("Este pedido foi cancelado.");
    }
    return this.toDomain(atual);
  }

  async cancelarPendentesPorAgencia(agenciaId: string): Promise<void> {
    await this.prisma.solicitacaoAtendimentoAgencia.updateMany({
      where: { agenciaId, status: StatusSolicitacaoAtendimentoAgencia.PENDENTE },
      data: { status: StatusSolicitacaoAtendimentoAgencia.CANCELADA, resolvidaEm: new Date() },
    });
  }

  async expirarPendentesVencidas(agenciaIds: string[]): Promise<void> {
    if (agenciaIds.length === 0) return;

    const cutoff = new Date(Date.now() - TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS);
    const vencidas = await this.prisma.solicitacaoAtendimentoAgencia.findMany({
      where: {
        agenciaId: { in: agenciaIds },
        status: StatusSolicitacaoAtendimentoAgencia.PENDENTE,
        criadaEm: { lt: cutoff },
      },
    });

    for (const vencida of vencidas) {
      try {
        const claim = await this.prisma.solicitacaoAtendimentoAgencia.updateMany({
          where: { id: vencida.id, status: StatusSolicitacaoAtendimentoAgencia.PENDENTE },
          data: {
            status: StatusSolicitacaoAtendimentoAgencia.ACEITA,
            resolvidaEm: new Date(),
            resolvidaPorExpiracao: true,
          },
        });
        if (claim.count === 1) {
          await this.efetivar(vencida.agenciaId, vencida.novoAtendenteId);
        }
      } catch {
        // best-effort — próxima leitura tenta de novo.
      }
    }
  }

  // ÚNICO lugar que aplica o efeito de troca — sempre a mesma direção
  // (liberar quem atendia, criar pra quem fica), não importa o tipo. Ver
  // comentário em schema.prisma sobre atendenteAtualId/novoAtendenteId.
  // Não recebe atendenteAtualId — quem está atendendo agora é resolvido de
  // novo via findAtual, não confiado ao valor congelado na solicitação.
  private async efetivar(agenciaId: string, novoAtendenteId: string): Promise<void> {
    const atual = await this.atendimentoAgenciaRepository.findAtual(agenciaId);
    if (atual) await this.atendimentoAgenciaRepository.liberar(atual.id);
    await this.atendimentoAgenciaRepository.criar(agenciaId, novoAtendenteId);
  }

  // Transição preguiçosa PENDENTE → ACEITA (efetivando o efeito) quando já
  // passou TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS desde criadaEm —
  // "tempo esgotar sem cancelar" é sucesso aqui, diferente do chat. Devolve
  // true se o registro deixou de estar pendente (por expiração agora, ou
  // porque já não estava PENDENTE quando chegou aqui).
  private async expirarSeVencida(record: {
    id: string;
    status: StatusSolicitacaoAtendimentoAgencia;
    criadaEm: Date;
    agenciaId: string;
    atendenteAtualId: string;
    novoAtendenteId: string;
  }): Promise<boolean> {
    if (record.status !== StatusSolicitacaoAtendimentoAgencia.PENDENTE) return true;
    if (Date.now() - record.criadaEm.getTime() <= TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS) {
      return false;
    }

    const claim = await this.prisma.solicitacaoAtendimentoAgencia.updateMany({
      where: { id: record.id, status: StatusSolicitacaoAtendimentoAgencia.PENDENTE },
      data: {
        status: StatusSolicitacaoAtendimentoAgencia.ACEITA,
        resolvidaEm: new Date(),
        resolvidaPorExpiracao: true,
      },
    });
    if (claim.count === 1) {
      await this.efetivar(record.agenciaId, record.novoAtendenteId);
    }
    return true;
  }

  private toDomain(record: RegistroComRelacoes): SolicitacaoAtendimentoAgenciaEntity {
    return {
      id: record.id,
      agenciaId: record.agenciaId,
      agenciaNome: record.agencia.razaoSocial,
      tipo: TIPO_TO_ENTITY[record.tipo],
      solicitanteId: record.solicitanteId,
      solicitanteNome: record.solicitante.name,
      atendenteAtualId: record.atendenteAtualId,
      atendenteAtualNome: record.atendenteAtual.name,
      novoAtendenteId: record.novoAtendenteId,
      novoAtendenteNome: record.novoAtendente.name,
      status: STATUS_TO_ENTITY[record.status],
      criadaEm: record.criadaEm.toISOString(),
    };
  }
}
