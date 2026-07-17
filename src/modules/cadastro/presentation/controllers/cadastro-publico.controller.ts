import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { LocalFileStorage } from "@/modules/cadastro/infrastructure/adapters/local-file-storage.adapter";
import { GcsFileStorage } from "@/modules/cadastro/infrastructure/adapters/gcs-file-storage.adapter";
import { MockQsaConsultaService } from "@/modules/cadastro/infrastructure/adapters/mock-qsa-consulta.adapter";
import { MockD4SignService } from "@/modules/cadastro/infrastructure/adapters/mock-d4sign.adapter";
import { MockAnaliseIaService } from "@/modules/cadastro/infrastructure/adapters/mock-analise-ia.adapter";
import { FinalizarCadastroUseCase } from "@/modules/cadastro/application/use-cases/finalizar-cadastro.use-case";
import { ConsultarQsaUseCase } from "@/modules/cadastro/application/use-cases/consultar-qsa.use-case";
import type { FinalizarCadastroInput } from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

// Composition root do módulo cadastro (área pública): única camada que
// conhece Prisma/filesystem/QSA/D4Sign/IA concretos. QsaConsultaService,
// ContratoAssinaturaService e AnaliseIaService hoje apontam pros mocks
// (ver MockQsaConsultaService, MockD4SignService, MockAnaliseIaService)
// até existir integração real — trocar a implementação aqui não afeta
// use-cases/domain. FileStorage usa GCS quando GCS_BUCKET_NAME está
// configurada, senão cai pro disco local (dev sem credencial de nuvem).
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const fileStorage = process.env.GCS_BUCKET_NAME ? new GcsFileStorage() : new LocalFileStorage();
const qsaConsultaService = new MockQsaConsultaService();
const contratoAssinaturaService = new MockD4SignService();
const analiseIaService = new MockAnaliseIaService();

export const cadastroPublicoController = {
  finalizarCadastro(input: FinalizarCadastroInput) {
    const useCase = new FinalizarCadastroUseCase(
      agenciaRepository,
      fileStorage,
      qsaConsultaService,
      contratoAssinaturaService,
      analiseIaService,
    );
    return useCase.execute(input);
  },

  consultarQsa(cnpj: string) {
    const useCase = new ConsultarQsaUseCase(qsaConsultaService);
    return useCase.execute({ cnpj });
  },
};
