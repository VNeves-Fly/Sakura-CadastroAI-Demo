import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAssociacaoRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-associacao.repository";
import { ListarAssociacoesUseCase } from "@/modules/atribuicoes/application/use-cases/listar-associacoes.use-case";
import { GetAssociacaoByIdUseCase } from "@/modules/associacoes/application/use-cases/get-associacao-by-id.use-case";
import { CreateAssociacaoUseCase } from "@/modules/associacoes/application/use-cases/create-associacao.use-case";
import { UpdateAssociacaoUseCase } from "@/modules/associacoes/application/use-cases/update-associacao.use-case";
import type { CreateAssociacaoInput } from "@/modules/associacoes/application/dto/create-associacao.dto";
import type { UpdateAssociacaoInput } from "@/modules/associacoes/application/dto/update-associacao.dto";

// Domínio (entidade/repositório) de Associacao mora em atribuicoes (dono
// original do model) — este é só o composition root da API de CRUD nova.
const associacaoRepository = new PrismaAssociacaoRepository(prisma);

export const associacoesController = {
  async list() {
    const useCase = new ListarAssociacoesUseCase(associacaoRepository);
    const associacoes = await useCase.execute();
    return associacoes.map((associacao) => associacao.toJSON());
  },

  async getById(id: string) {
    const useCase = new GetAssociacaoByIdUseCase(associacaoRepository);
    const associacao = await useCase.execute(id);
    return associacao.toJSON();
  },

  async create(input: CreateAssociacaoInput) {
    const useCase = new CreateAssociacaoUseCase(associacaoRepository);
    const associacao = await useCase.execute(input);
    return associacao.toJSON();
  },

  async update(id: string, data: UpdateAssociacaoInput) {
    const useCase = new UpdateAssociacaoUseCase(associacaoRepository);
    const associacao = await useCase.execute({ id, data });
    return associacao.toJSON();
  },
};
