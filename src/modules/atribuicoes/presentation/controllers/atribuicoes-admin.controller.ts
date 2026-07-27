import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaPromotorRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-promotor.repository";
import { PrismaAssociacaoRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-associacao.repository";
import { PrismaCidadeComercialRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-cidade-comercial.repository";
import { ListarPromotoresUseCase } from "@/modules/atribuicoes/application/use-cases/listar-promotores.use-case";
import { ListarAgenciasPorPromotorUseCase } from "@/modules/atribuicoes/application/use-cases/listar-agencias-por-promotor.use-case";
import { ListarAssociacoesUseCase } from "@/modules/atribuicoes/application/use-cases/listar-associacoes.use-case";
import { ListarCidadesComerciaisUseCase } from "@/modules/atribuicoes/application/use-cases/listar-cidades-comerciais.use-case";
import {
  SubstituirAtribuicaoUseCase,
  type SubstituirAtribuicaoInput,
} from "@/modules/atribuicoes/application/use-cases/substituir-atribuicao.use-case";
import { ListarHistoricoAtribuicoesUseCase } from "@/modules/atribuicoes/application/use-cases/listar-historico-atribuicoes.use-case";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";

const promotorRepository = new PrismaPromotorRepository(prisma);
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const associacaoRepository = new PrismaAssociacaoRepository(prisma);
const cidadeComercialRepository = new PrismaCidadeComercialRepository(prisma);

// Única porta de entrada do módulo atribuições pro back-end real.
export const atribuicoesAdminController = {
  listarPromotores() {
    const useCase = new ListarPromotoresUseCase(promotorRepository);
    return useCase.execute();
  },
  listarAgenciasPorPromotor(promotorId: string) {
    const useCase = new ListarAgenciasPorPromotorUseCase(agenciaRepository);
    return useCase.execute(promotorId);
  },
  listarAssociacoes() {
    const useCase = new ListarAssociacoesUseCase(associacaoRepository);
    return useCase.execute();
  },
  listarCidades() {
    const useCase = new ListarCidadesComerciaisUseCase(cidadeComercialRepository);
    return useCase.execute();
  },
  substituirAtribuicao(input: SubstituirAtribuicaoInput) {
    const useCase = new SubstituirAtribuicaoUseCase(cidadeComercialRepository);
    return useCase.execute(input);
  },
  listarHistoricoAtribuicoes() {
    const useCase = new ListarHistoricoAtribuicoesUseCase(cidadeComercialRepository);
    return useCase.execute();
  },
};
