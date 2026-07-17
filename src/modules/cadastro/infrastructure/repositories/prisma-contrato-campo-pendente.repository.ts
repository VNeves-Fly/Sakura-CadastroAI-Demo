import type {
  PrismaClient,
  ContratoCampoPendente as ContratoCampoPendenteRecord,
} from "@prisma/client";
import { ContratoCampoPendente } from "@/modules/cadastro/domain/entities/contrato-campo-pendente.entity";
import type {
  ContratoCampoPendenteRepository,
  CreateContratoCampoPendenteData,
} from "@/modules/cadastro/domain/repositories/contrato-campo-pendente-repository";

export class PrismaContratoCampoPendenteRepository implements ContratoCampoPendenteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByContratoSignatarioId(contratoSignatarioId: string): Promise<ContratoCampoPendente[]> {
    const records = await this.prisma.contratoCampoPendente.findMany({
      where: { contratoSignatarioId },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateContratoCampoPendenteData): Promise<ContratoCampoPendente> {
    const record = await this.prisma.contratoCampoPendente.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: ContratoCampoPendenteRecord): ContratoCampoPendente {
    return ContratoCampoPendente.create({
      id: record.id,
      contratoSignatarioId: record.contratoSignatarioId,
      campo: record.campo,
    });
  }
}
