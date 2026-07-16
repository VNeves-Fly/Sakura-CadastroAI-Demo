import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { LocalFileStorage } from "@/modules/cadastro/infrastructure/adapters/local-file-storage.adapter";
import { MockQsaConsultaService } from "@/modules/cadastro/infrastructure/adapters/mock-qsa-consulta.adapter";
import { FinalizarCadastroUseCase } from "@/modules/cadastro/application/use-cases/finalizar-cadastro.use-case";
import { ConsultarQsaUseCase } from "@/modules/cadastro/application/use-cases/consultar-qsa.use-case";
import type { FinalizarCadastroInput } from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

// Composition root do módulo cadastro (área pública): única camada que
// conhece Prisma/filesystem/QSA concretos. QsaConsultaService hoje aponta
// pro mock (ver MockQsaConsultaService) até existir integração real com a
// Receita Federal — trocar a implementação aqui não afeta use-cases/domain.
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const fileStorage = new LocalFileStorage();
const qsaConsultaService = new MockQsaConsultaService();

export const cadastroPublicoController = {
  finalizarCadastro(input: FinalizarCadastroInput) {
    const useCase = new FinalizarCadastroUseCase(
      agenciaRepository,
      fileStorage,
      qsaConsultaService,
    );
    return useCase.execute(input);
  },

  consultarQsa(cnpj: string) {
    const useCase = new ConsultarQsaUseCase(qsaConsultaService);
    return useCase.execute({ cnpj });
  },
};
