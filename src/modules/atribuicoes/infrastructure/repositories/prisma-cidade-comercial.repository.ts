import type { PrismaClient, CidadeComercial as CidadeComercialRecord } from "@prisma/client";
import { CidadeComercial } from "@/modules/atribuicoes/domain/entities/cidade-comercial.entity";
import type { CidadeComercialRepository } from "@/modules/atribuicoes/domain/repositories/cidade-comercial-repository";
import type {
  SubstituicaoHistorico,
  TipoAtribuicao,
} from "@/modules/atribuicoes/types/atribuicao.types";

function toDomain(record: CidadeComercialRecord): CidadeComercial {
  return CidadeComercial.create({
    id: record.id,
    regiao: record.regiao,
    estado: record.estado,
    cidade: record.cidade,
    ddd: record.ddd,
    base: record.base,
    executivo: record.executivo,
    gestor: record.gestor,
    subregiaoSp: record.subregiaoSp,
  });
}

export class PrismaCidadeComercialRepository implements CidadeComercialRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<CidadeComercial[]> {
    const records = await this.prisma.cidadeComercial.findMany({ orderBy: { cidade: "asc" } });
    return records.map(toDomain);
  }

  async substituir(tipo: TipoAtribuicao, nomeAntigo: string, nomeNovo: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      let count: number;

      if (tipo === "executivo") {
        ({ count } = await tx.cidadeComercial.updateMany({
          where: { executivo: nomeAntigo },
          data: { executivo: nomeNovo },
        }));
      } else if (tipo === "gestor") {
        ({ count } = await tx.cidadeComercial.updateMany({
          where: { gestor: nomeAntigo },
          data: { gestor: nomeNovo },
        }));
      } else {
        ({ count } = await tx.cidadeComercial.updateMany({
          where: { base: nomeAntigo },
          data: { base: nomeNovo },
        }));
      }

      await tx.substituicaoAtribuicao.create({
        data: { tipo, nomeAntigo, nomeNovo, totalCidadesAfetadas: count },
      });

      return count;
    });
  }

  async listarHistorico(): Promise<SubstituicaoHistorico[]> {
    const records = await this.prisma.substituicaoAtribuicao.findMany({
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => ({
      tipo: record.tipo as TipoAtribuicao,
      nomeAntigo: record.nomeAntigo,
      nomeNovo: record.nomeNovo,
      totalCidadesAfetadas: record.totalCidadesAfetadas,
      data: record.createdAt.toISOString(),
    }));
  }
}
