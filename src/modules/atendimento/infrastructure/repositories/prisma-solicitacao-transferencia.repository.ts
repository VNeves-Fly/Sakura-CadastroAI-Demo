import { StatusSolicitacaoTransferencia, type PrismaClient } from "@prisma/client";
import { TIMEOUT_TRANSFERENCIA_MS } from "@/modules/atendimento/domain/atendimento.constants";
import type {
  StatusSolicitacaoTransferenciaEntity,
  SolicitacaoTransferenciaEntity,
} from "@/modules/atendimento/domain/entities/solicitacao-transferencia.entity";
import type {
  CriarSolicitacaoTransferenciaData,
  SolicitacaoTransferenciaAtual,
  SolicitacaoTransferenciaRepository,
} from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";

const STATUS_TO_ENTITY: Record<
  StatusSolicitacaoTransferencia,
  StatusSolicitacaoTransferenciaEntity
> = {
  PENDENTE: "pendente",
  ACEITA: "aceita",
  RECUSADA: "recusada",
  EXPIRADA: "expirada",
};

interface RegistroComRelacoes {
  id: string;
  conversaId: string;
  status: StatusSolicitacaoTransferencia;
  criadaEm: Date;
  deAnalista: { name: string };
  paraAnalista: { name: string };
}

const INCLUDE_NOMES = {
  deAnalista: { select: { name: true } },
  paraAnalista: { select: { name: true } },
} as const;

export class PrismaSolicitacaoTransferenciaRepository implements SolicitacaoTransferenciaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findVisivelPorConversa(conversaId: string): Promise<SolicitacaoTransferenciaEntity | null> {
    const record = await this.prisma.solicitacaoTransferencia.findFirst({
      where: { conversaId, limpaEm: null },
      orderBy: { criadaEm: "desc" },
      include: INCLUDE_NOMES,
    });
    if (!record) return null;

    const status = await this.expirarSeVencida(record.id, record.status, record.criadaEm);
    return this.toDomain({ ...record, status });
  }

  async findPendentePorConversa(conversaId: string): Promise<SolicitacaoTransferenciaAtual | null> {
    const record = await this.prisma.solicitacaoTransferencia.findFirst({
      where: { conversaId, status: StatusSolicitacaoTransferencia.PENDENTE },
      orderBy: { criadaEm: "desc" },
    });
    if (!record) return null;

    const status = await this.expirarSeVencida(record.id, record.status, record.criadaEm);
    if (status !== StatusSolicitacaoTransferencia.PENDENTE) return null;

    return { id: record.id, paraAnalistaId: record.paraAnalistaId, criadaEm: record.criadaEm };
  }

  async criar(data: CriarSolicitacaoTransferenciaData): Promise<SolicitacaoTransferenciaEntity> {
    const record = await this.prisma.solicitacaoTransferencia.create({
      data: {
        conversaId: data.conversaId,
        deAnalistaId: data.deAnalistaId,
        paraAnalistaId: data.paraAnalistaId,
      },
      include: INCLUDE_NOMES,
    });
    return this.toDomain(record);
  }

  async aceitar(id: string): Promise<void> {
    const agora = new Date();
    // limpaEm já vai marcado — solicitação aceita não precisa de "Entendi"
    // do solicitante, o atendimentoAtual já reflete o novo dono sozinho.
    await this.prisma.solicitacaoTransferencia.update({
      where: { id },
      data: { status: StatusSolicitacaoTransferencia.ACEITA, resolvidaEm: agora, limpaEm: agora },
    });
  }

  async recusar(id: string): Promise<void> {
    await this.prisma.solicitacaoTransferencia.update({
      where: { id },
      data: { status: StatusSolicitacaoTransferencia.RECUSADA, resolvidaEm: new Date() },
    });
  }

  async limpar(conversaId: string): Promise<void> {
    await this.prisma.solicitacaoTransferencia.updateMany({
      where: { conversaId, limpaEm: null },
      data: { limpaEm: new Date() },
    });
  }

  // Transição preguiçosa PENDENTE → EXPIRADA na leitura, quando já passou
  // TIMEOUT_TRANSFERENCIA_MS desde criadaEm — evita depender de job em
  // background só pra isso.
  private async expirarSeVencida(
    id: string,
    status: StatusSolicitacaoTransferencia,
    criadaEm: Date,
  ): Promise<StatusSolicitacaoTransferencia> {
    if (status !== StatusSolicitacaoTransferencia.PENDENTE) return status;
    if (Date.now() - criadaEm.getTime() <= TIMEOUT_TRANSFERENCIA_MS) return status;

    await this.prisma.solicitacaoTransferencia.update({
      where: { id },
      data: { status: StatusSolicitacaoTransferencia.EXPIRADA, resolvidaEm: new Date() },
    });
    return StatusSolicitacaoTransferencia.EXPIRADA;
  }

  private toDomain(record: RegistroComRelacoes): SolicitacaoTransferenciaEntity {
    return {
      id: record.id,
      conversaId: record.conversaId,
      deAnalista: record.deAnalista.name,
      paraAnalista: record.paraAnalista.name,
      status: STATUS_TO_ENTITY[record.status],
      criadaEm: record.criadaEm.toISOString(),
    };
  }
}
