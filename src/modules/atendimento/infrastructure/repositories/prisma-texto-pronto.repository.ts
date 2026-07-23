import type { PrismaClient } from "@prisma/client";
import type {
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
}
