import type { PrismaClient } from "@prisma/client";
import type {
  AtualizarTextoProntoData,
  CriarTextoProntoData,
  TextoProntoRepository,
} from "@/modules/atendimento/domain/repositories/texto-pronto-repository";
import type { TextoProntoEntity } from "@/modules/atendimento/domain/entities/texto-pronto.entity";

export class PrismaTextoProntoRepository implements TextoProntoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<TextoProntoEntity[]> {
    const records = await this.prisma.textoPronto.findMany({ orderBy: { createdAt: "asc" } });
    return records.map((record) => ({
      id: record.id,
      titulo: record.titulo,
      conteudo: record.conteudo,
    }));
  }

  async findById(id: string): Promise<TextoProntoEntity | null> {
    const record = await this.prisma.textoPronto.findUnique({ where: { id } });
    return record ? { id: record.id, titulo: record.titulo, conteudo: record.conteudo } : null;
  }

  async create(data: CriarTextoProntoData): Promise<TextoProntoEntity> {
    const record = await this.prisma.textoPronto.create({
      data: {
        titulo: data.titulo,
        conteudo: data.conteudo,
        criadoPorId: data.criadoPorId,
      },
    });
    return { id: record.id, titulo: record.titulo, conteudo: record.conteudo };
  }

  async update(id: string, data: AtualizarTextoProntoData): Promise<TextoProntoEntity> {
    const record = await this.prisma.textoPronto.update({
      where: { id },
      data: { titulo: data.titulo, conteudo: data.conteudo },
    });
    return { id: record.id, titulo: record.titulo, conteudo: record.conteudo };
  }

  async remover(id: string): Promise<void> {
    await this.prisma.textoPronto.delete({ where: { id } });
  }
}
