import type { PrismaClient, VendaPercentual as VendaPercentualRecord } from "@prisma/client";
import { VendaPercentual } from "@/modules/cadastro/domain/entities/venda-percentual.entity";
import type {
  CreateVendaPercentualData,
  VendaPercentualRepository,
} from "@/modules/cadastro/domain/repositories/venda-percentual-repository";

export class PrismaVendaPercentualRepository implements VendaPercentualRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCadastroComplementarId(cadastroComplementarId: string): Promise<VendaPercentual[]> {
    const records = await this.prisma.vendaPercentual.findMany({
      where: { cadastroComplementarId },
    });
    return records.map((record) => this.toDomain(record));
  }

  async upsert(data: CreateVendaPercentualData): Promise<VendaPercentual> {
    if (!data.tipo) {
      throw new Error("VendaPercentual.tipo é obrigatório para upsert.");
    }

    const record = await this.prisma.vendaPercentual.upsert({
      where: {
        cadastroComplementarId_tipo: {
          cadastroComplementarId: data.cadastroComplementarId,
          tipo: data.tipo,
        },
      },
      create: data,
      update: { percentual: data.percentual },
    });
    return this.toDomain(record);
  }

  private toDomain(record: VendaPercentualRecord): VendaPercentual {
    return VendaPercentual.create({
      id: record.id,
      cadastroComplementarId: record.cadastroComplementarId,
      tipo: record.tipo,
      percentual: record.percentual?.toNumber() ?? null,
    });
  }
}
