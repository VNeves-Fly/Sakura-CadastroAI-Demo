import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { MockD4SignService } from "@/modules/cadastro/infrastructure/adapters/mock-d4sign.adapter";
import { ListarCadastrosUseCase } from "@/modules/cadastro/application/use-cases/listar-cadastros.use-case";
import { ObterDetalheAgenciaUseCase } from "@/modules/cadastro/application/use-cases/obter-detalhe-agencia.use-case";
import { AprovarCadastroComplementarUseCase } from "@/modules/cadastro/application/use-cases/aprovar-cadastro-complementar.use-case";
import {
  AtualizarStatusCadastroUseCase,
  type AtualizarStatusCadastroInput,
} from "@/modules/cadastro/application/use-cases/atualizar-status-cadastro.use-case";
import {
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_ATIVO,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ListarCadastrosFiltros } from "@/modules/cadastro/domain/repositories/agencia-repository";

// Composition root do módulo cadastro (área Admin) — mesmo domínio do
// controller público (Agencia), só que pra leitura/gestão interna.
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const contratoAssinaturaService = new MockD4SignService();

export const cadastroAdminController = {
  listarCadastros(filtros: ListarCadastrosFiltros) {
    const useCase = new ListarCadastrosUseCase(agenciaRepository);
    return useCase.execute(filtros);
  },

  obterDetalhe(id: string) {
    const useCase = new ObterDetalheAgenciaUseCase(agenciaRepository);
    return useCase.execute(id);
  },

  aprovarComplementar(id: string) {
    const useCase = new AprovarCadastroComplementarUseCase(
      agenciaRepository,
      contratoAssinaturaService,
    );
    return useCase.execute(id);
  },

  atualizarStatus(input: AtualizarStatusCadastroInput) {
    const useCase = new AtualizarStatusCadastroUseCase(agenciaRepository);
    return useCase.execute(input);
  },

  marcarContratoAssinado(id: string) {
    return this.atualizarStatus({ id, status: STATUS_AGUARDANDO_VALIDACAO });
  },

  ativarCliente(id: string) {
    return this.atualizarStatus({ id, status: STATUS_ATIVO });
  },

  recusarCadastro(id: string) {
    return this.atualizarStatus({ id, status: STATUS_RECUSADO });
  },
};
