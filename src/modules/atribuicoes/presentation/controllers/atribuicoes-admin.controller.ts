import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaPromotorRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-promotor.repository";
import { PrismaAssociacaoRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-associacao.repository";
import { PrismaCidadeComercialRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-cidade-comercial.repository";
import { PrismaGestorRepository } from "@/modules/gestores/infrastructure/repositories/prisma-gestor.repository";
import { ListarPromotoresUseCase } from "@/modules/atribuicoes/application/use-cases/listar-promotores.use-case";
import { ListarGestoresUseCase } from "@/modules/gestores/application/use-cases/listar-gestores.use-case";
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
const gestorRepository = new PrismaGestorRepository(prisma);

// Única porta de entrada do módulo atribuições pro back-end real.
export const atribuicoesAdminController = {
  listarPromotores() {
    const useCase = new ListarPromotoresUseCase(promotorRepository);
    return useCase.execute();
  },
  // Resolve "qual Promotor/Gestor é o usuário logado" — usado pelo escopo
  // de leitura de Gestor/Executivo em /cadastros (2026-08-03).
  buscarPromotorPorUserId(userId: string) {
    return promotorRepository.findByUserId(userId);
  },
  buscarGestorPorUserId(userId: string) {
    return gestorRepository.findByUserId(userId);
  },
  buscarPromotorPorId(id: string) {
    return promotorRepository.findById(id);
  },
  // Fonte real do Gestor (model próprio, 2026-08-03) — substitui o antigo
  // derivar a lista de gestores a partir da string livre Promotor.gestor.
  listarGestores() {
    const useCase = new ListarGestoresUseCase(gestorRepository);
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
