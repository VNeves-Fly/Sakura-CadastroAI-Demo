import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { LocalFileStorage } from "@/modules/cadastro/infrastructure/adapters/local-file-storage.adapter";
import { MockQsaConsultaService } from "@/modules/cadastro/infrastructure/adapters/mock-qsa-consulta.adapter";
import { PreCadastrarAgenciaUseCase } from "@/modules/cadastro/application/use-cases/pre-cadastrar-agencia.use-case";
import { ConsultarQsaUseCase } from "@/modules/cadastro/application/use-cases/consultar-qsa.use-case";
import type { PreCadastrarAgenciaInput } from "@/modules/cadastro/application/dto/pre-cadastrar-agencia.dto";

// Composition root do módulo cadastro (área pública): única camada que
// conhece Prisma/filesystem/QSA concretos. QsaConsultaService hoje aponta
// pro mock (ver MockQsaConsultaService) até existir integração real com a
// Receita Federal — trocar a implementação aqui não afeta use-cases/domain.
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const fileStorage = new LocalFileStorage();
const qsaConsultaService = new MockQsaConsultaService();

export const cadastroPublicoController = {
  preCadastrarAgencia(input: PreCadastrarAgenciaInput) {
    const useCase = new PreCadastrarAgenciaUseCase(
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
