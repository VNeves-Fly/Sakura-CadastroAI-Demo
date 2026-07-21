import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { PrismaDocumentoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-documento.repository";
import { PrismaDadosReceitaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-dados-receita.repository";
import { PrismaSignatarioPadraoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-signatario-padrao.repository";
import { LocalFileStorage } from "@/modules/cadastro/infrastructure/adapters/local-file-storage.adapter";
import { GcsFileStorage } from "@/modules/cadastro/infrastructure/adapters/gcs-file-storage.adapter";
import { createQsaConsultaService } from "@/modules/cadastro/infrastructure/factories/qsa-consulta-service.factory";
import { MockD4SignService } from "@/modules/cadastro/infrastructure/adapters/mock-d4sign.adapter";
import { D4SignAdapter } from "@/modules/cadastro/infrastructure/adapters/d4sign.adapter";
import { MockAnaliseIaService } from "@/modules/cadastro/infrastructure/adapters/mock-analise-ia.adapter";
import { FlysakuraAnaliseIaAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter";
import { MockDocumentAnalysisService } from "@/modules/cadastro/infrastructure/adapters/mock-document-analysis.adapter";
import { FlysakuraDocumentAnalysisAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-document-analysis.adapter";
import { FinalizarCadastroUseCase } from "@/modules/cadastro/application/use-cases/finalizar-cadastro.use-case";
import { ConsultarQsaUseCase } from "@/modules/cadastro/application/use-cases/consultar-qsa.use-case";
import { AnalisarContratoSocialUseCase } from "@/modules/cadastro/application/use-cases/analisar-contrato-social.use-case";
import { AnalisarDocumentoIdentificacaoUseCase } from "@/modules/cadastro/application/use-cases/analisar-documento-identificacao.use-case";
import { ListarDocumentosPendentesUseCase } from "@/modules/cadastro/application/use-cases/listar-documentos-pendentes.use-case";
import {
  ReenviarDocumentoUseCase,
  type ReenviarDocumentoInput,
} from "@/modules/cadastro/application/use-cases/reenviar-documento.use-case";
import type { FinalizarCadastroInput } from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";
import type { AnalisarContratoSocialInput } from "@/modules/cadastro/application/dto/analisar-contrato-social.dto";
import type { AnalisarDocumentoIdentificacaoInput } from "@/modules/cadastro/application/dto/analisar-documento-identificacao.dto";

// Composition root do módulo cadastro (área pública): única camada que
// conhece Prisma/filesystem/QSA/D4Sign/IA concretos. FileStorage usa GCS
// quando GCS_BUCKET_NAME está configurada, senão cai pro disco local.
// AnaliseIaService usa o agente real (agents.flysakura.com) quando
// AGENCY_ANALYSIS_API_KEY está configurada, senão cai pro mock (checksum
// do CNPJ). QsaConsultaService vem de uma factory (ver
// infrastructure/factories/qsa-consulta-service.factory.ts) — hoje resolve
// pra ReceitaWS ou mock; é o ponto único de troca quando o SERPRO entrar.
// ContratoAssinaturaService usa o D4Sign real quando D4SIGN_TOKEN_API está
// configurada, senão cai pro mock. DocumentAnalysisService (análise por
// documento, antes da avaliação final) usa a mesma credencial de
// AnaliseIaService (AGENCY_ANALYSIS_API_KEY) — são o mesmo agente.
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const documentoRepository = new PrismaDocumentoRepository(prisma);
const dadosReceitaRepository = new PrismaDadosReceitaRepository(prisma);
const signatarioPadraoRepository = new PrismaSignatarioPadraoRepository(prisma);
const fileStorage = process.env.GCS_BUCKET_NAME ? new GcsFileStorage() : new LocalFileStorage();
const qsaConsultaService = createQsaConsultaService();
const contratoAssinaturaService = process.env.D4SIGN_TOKEN_API
  ? new D4SignAdapter(signatarioPadraoRepository)
  : new MockD4SignService();
const analiseIaService = process.env.AGENCY_ANALYSIS_API_KEY
  ? new FlysakuraAnaliseIaAdapter()
  : new MockAnaliseIaService();
const documentAnalysisService = process.env.AGENCY_ANALYSIS_API_KEY
  ? new FlysakuraDocumentAnalysisAdapter()
  : new MockDocumentAnalysisService();

export const cadastroPublicoController = {
  finalizarCadastro(input: FinalizarCadastroInput) {
    const useCase = new FinalizarCadastroUseCase(
      agenciaRepository,
      fileStorage,
      qsaConsultaService,
      contratoAssinaturaService,
      analiseIaService,
      documentAnalysisService,
      dadosReceitaRepository,
    );
    return useCase.execute(input);
  },

  consultarQsa(cnpj: string) {
    const useCase = new ConsultarQsaUseCase(qsaConsultaService);
    return useCase.execute({ cnpj });
  },

  analisarContratoSocial(input: AnalisarContratoSocialInput) {
    const useCase = new AnalisarContratoSocialUseCase(fileStorage, documentAnalysisService);
    return useCase.execute(input);
  },

  analisarDocumentoIdentificacao(input: AnalisarDocumentoIdentificacaoInput) {
    const useCase = new AnalisarDocumentoIdentificacaoUseCase(fileStorage, documentAnalysisService);
    return useCase.execute(input);
  },

  listarDocumentosPendentes(agenciaId: string) {
    const useCase = new ListarDocumentosPendentesUseCase(agenciaRepository);
    return useCase.execute(agenciaId);
  },

  reenviarDocumento(input: ReenviarDocumentoInput) {
    const useCase = new ReenviarDocumentoUseCase(documentoRepository, fileStorage);
    return useCase.execute(input);
  },
};
