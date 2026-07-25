import type { PrismaClient } from "@prisma/client";
import type { ExecutivoResolver } from "@/modules/cadastro/domain/repositories/executivo-resolver";

// Consulta a tabela `promotores` direto (sem importar o domínio Promotor
// de `atribuicoes`) — só precisa confirmar existência e devolver o id.
export class PrismaExecutivoResolver implements ExecutivoResolver {
  constructor(private readonly prisma: PrismaClient) {}

  async resolve(rawValue: string): Promise<string | null> {
    const porId = await this.prisma.promotor.findUnique({
      where: { id: rawValue },
      select: { id: true },
    });
    if (porId) return porId.id;

    const porLinkPessoal = await this.prisma.promotor.findFirst({
      where: { linkExecutivoId: { has: rawValue } },
      select: { id: true },
    });
    return porLinkPessoal?.id ?? null;
  }
}
