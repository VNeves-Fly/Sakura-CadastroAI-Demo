import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaPromotorRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-promotor.repository";
import { ListarPromotoresUseCase } from "@/modules/atribuicoes/application/use-cases/listar-promotores.use-case";
import { ListarAgenciasPorPromotorUseCase } from "@/modules/atribuicoes/application/use-cases/listar-agencias-por-promotor.use-case";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";

const promotorRepository = new PrismaPromotorRepository(prisma);
const agenciaRepository = new PrismaAgenciaRepository(prisma);

// Única porta de entrada do módulo atribuições pro back-end real — o
// resto do módulo (cidades, bases, regiões) continua em memória
// (ver atribuicoes-store.ts) até ganhar tabela própria.
export const atribuicoesAdminController = {
  listarPromotores() {
    const useCase = new ListarPromotoresUseCase(promotorRepository);
    return useCase.execute();
  },
  listarAgenciasPorPromotor(linkExecutivoId: string[]) {
    const useCase = new ListarAgenciasPorPromotorUseCase(agenciaRepository);
    return useCase.execute(linkExecutivoId);
  },
};
