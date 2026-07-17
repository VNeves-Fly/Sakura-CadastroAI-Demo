import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { LocalFileStorage } from "@/modules/cadastro/infrastructure/adapters/local-file-storage.adapter";
import { GcsFileStorage } from "@/modules/cadastro/infrastructure/adapters/gcs-file-storage.adapter";
import { MockQsaConsultaService } from "@/modules/cadastro/infrastructure/adapters/mock-qsa-consulta.adapter";
import { ReceitaWsQsaConsultaAdapter } from "@/modules/cadastro/infrastructure/adapters/receitaws-qsa-consulta.adapter";
import { MockD4SignService } from "@/modules/cadastro/infrastructure/adapters/mock-d4sign.adapter";
import { MockAnaliseIaService } from "@/modules/cadastro/infrastructure/adapters/mock-analise-ia.adapter";
import { FlysakuraAnaliseIaAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter";
import { FinalizarCadastroUseCase } from "@/modules/cadastro/application/use-cases/finalizar-cadastro.use-case";
import { ConsultarQsaUseCase } from "@/modules/cadastro/application/use-cases/consultar-qsa.use-case";
import type { FinalizarCadastroInput } from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

// Composition root do módulo cadastro (área pública): única camada que
// conhece Prisma/filesystem/QSA/D4Sign/IA concretos. ContratoAssinaturaService
// hoje aponta pro mock (ver MockD4SignService) até existir integração real —
// trocar a implementação aqui não afeta use-cases/domain. FileStorage usa
// GCS quando GCS_BUCKET_NAME está configurada, senão cai pro disco local.
// AnaliseIaService usa o agente real (agents.flysakura.com) quando
// AGENCY_ANALYSIS_API_KEY está configurada, senão cai pro mock (checksum
// do CNPJ). QsaConsultaService usa a API Comercial do ReceitaWS quando
// RECEITAWS_API_TOKEN está configurada, senão cai pro mock.
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const fileStorage = process.env.GCS_BUCKET_NAME ? new GcsFileStorage() : new LocalFileStorage();
const qsaConsultaService = process.env.RECEITAWS_API_TOKEN
  ? new ReceitaWsQsaConsultaAdapter()
  : new MockQsaConsultaService();
const contratoAssinaturaService = new MockD4SignService();
const analiseIaService = process.env.AGENCY_ANALYSIS_API_KEY
  ? new FlysakuraAnaliseIaAdapter()
  : new MockAnaliseIaService();

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
