import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { PrismaDadosReceitaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-dados-receita.repository";
import { PrismaUsuarioMasterRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-usuario-master.repository";
import { PrismaCadastroComplementarRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-cadastro-complementar.repository";
import { PrismaRepresentanteLegalRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-representante-legal.repository";
import { PrismaEnderecoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-endereco.repository";
import { PrismaDocumentoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-documento.repository";
import { PrismaAnaliseIaDocumentoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-analise-ia-documento.repository";
import { PrismaContratoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato.repository";
import { PrismaContratoSignatarioRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato-signatario.repository";
import { PrismaSignatarioPadraoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-signatario-padrao.repository";
import { PrismaContratoEmailFalhaEntregaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato-email-falha-entrega.repository";
import { MockD4SignService } from "@/modules/cadastro/infrastructure/adapters/mock-d4sign.adapter";
import { D4SignAdapter } from "@/modules/cadastro/infrastructure/adapters/d4sign.adapter";
import { ListarCadastrosUseCase } from "@/modules/cadastro/application/use-cases/listar-cadastros.use-case";
import { ObterDetalheAgenciaUseCase } from "@/modules/cadastro/application/use-cases/obter-detalhe-agencia.use-case";
import { ObterDadosReceitaUseCase } from "@/modules/cadastro/application/use-cases/obter-dados-receita.use-case";
import { ObterUsuarioMasterUseCase } from "@/modules/cadastro/application/use-cases/obter-usuario-master.use-case";
import {
  SalvarUsuarioMasterUseCase,
  type SalvarUsuarioMasterInput,
} from "@/modules/cadastro/application/use-cases/salvar-usuario-master.use-case";
import { AprovarCadastroComplementarUseCase } from "@/modules/cadastro/application/use-cases/aprovar-cadastro-complementar.use-case";
import { MarcarContratoAssinadoUseCase } from "@/modules/cadastro/application/use-cases/marcar-contrato-assinado.use-case";
import { ObterAnaliseContratosUseCase } from "@/modules/cadastro/application/use-cases/obter-analise-contratos.use-case";
import {
  AtualizarStatusCadastroUseCase,
  type AtualizarStatusCadastroInput,
} from "@/modules/cadastro/application/use-cases/atualizar-status-cadastro.use-case";
import {
  SalvarSicaUseCase,
  type SalvarSicaInput,
} from "@/modules/cadastro/application/use-cases/salvar-sica.use-case";
import {
  SalvarTravelLinkUseCase,
  type SalvarTravelLinkInput,
} from "@/modules/cadastro/application/use-cases/salvar-travel-link.use-case";
import { ObterCadastroComplementarUseCase } from "@/modules/cadastro/application/use-cases/obter-cadastro-complementar.use-case";
import { ListarRepresentantesLegaisUseCase } from "@/modules/cadastro/application/use-cases/listar-representantes-legais.use-case";
import { ObterRepresentanteLegalUseCase } from "@/modules/cadastro/application/use-cases/obter-representante-legal.use-case";
import {
  ObterEnderecoUseCase,
  type ObterEnderecoInput,
} from "@/modules/cadastro/application/use-cases/obter-endereco.use-case";
import { ListarDocumentosUseCase } from "@/modules/cadastro/application/use-cases/listar-documentos.use-case";
import { ObterDocumentoUseCase } from "@/modules/cadastro/application/use-cases/obter-documento.use-case";
import { ObterAnaliseIaDocumentoUseCase } from "@/modules/cadastro/application/use-cases/obter-analise-ia-documento.use-case";
import { AprovarDocumentoUseCase } from "@/modules/cadastro/application/use-cases/aprovar-documento.use-case";
import {
  ReprovarDocumentoUseCase,
  type ReprovarDocumentoInput,
} from "@/modules/cadastro/application/use-cases/reprovar-documento.use-case";
import { ObterArquivoDocumentoUseCase } from "@/modules/cadastro/application/use-cases/obter-arquivo-documento.use-case";
import { LocalDocumentoArquivoAdapter } from "@/modules/cadastro/infrastructure/adapters/local-documento-arquivo.adapter";
import { GcsDocumentoArquivoAdapter } from "@/modules/cadastro/infrastructure/adapters/gcs-documento-arquivo.adapter";
import {
  SolicitarReenvioDocumentosUseCase,
  type SolicitarReenvioDocumentosInput,
} from "@/modules/cadastro/application/use-cases/solicitar-reenvio-documentos.use-case";
import { ResendEmailAdapter } from "@/modules/shared/infrastructure/adapters/resend-email.adapter";
import { ConsoleEmailAdapter } from "@/modules/shared/infrastructure/adapters/console-email.adapter";
import { ListarContratosUseCase } from "@/modules/cadastro/application/use-cases/listar-contratos.use-case";
import { ObterContratoUseCase } from "@/modules/cadastro/application/use-cases/obter-contrato.use-case";
import { ListarSignatariosContratoUseCase } from "@/modules/cadastro/application/use-cases/listar-signatarios-contrato.use-case";
import { ListarEmailsFalhaEntregaContratoUseCase } from "@/modules/cadastro/application/use-cases/listar-emails-falha-entrega-contrato.use-case";
import { ListarSignatariosPadraoAtivosUseCase } from "@/modules/cadastro/application/use-cases/listar-signatarios-padrao-ativos.use-case";
import { ListarSignatariosPadraoUseCase } from "@/modules/cadastro/application/use-cases/listar-signatarios-padrao.use-case";
import { ObterSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/obter-signatario-padrao.use-case";
import { CriarSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/criar-signatario-padrao.use-case";
import {
  AtualizarSignatarioPadraoUseCase,
  type AtualizarSignatarioPadraoInput,
} from "@/modules/cadastro/application/use-cases/atualizar-signatario-padrao.use-case";
import { RemoverSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/remover-signatario-padrao.use-case";
import { RestaurarSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/restaurar-signatario-padrao.use-case";
import type { CreateSignatarioPadraoData } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import {
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_ATIVO,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ListarCadastrosFiltros } from "@/modules/cadastro/domain/repositories/agencia-repository";

// Composition root do módulo cadastro (área Admin) — mesmo domínio do
// controller público (Agencia), só que pra leitura/gestão interna.
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const dadosReceitaRepository = new PrismaDadosReceitaRepository(prisma);
const usuarioMasterRepository = new PrismaUsuarioMasterRepository(prisma);
const cadastroComplementarRepository = new PrismaCadastroComplementarRepository(prisma);
const representanteLegalRepository = new PrismaRepresentanteLegalRepository(prisma);
const enderecoRepository = new PrismaEnderecoRepository(prisma);
const documentoRepository = new PrismaDocumentoRepository(prisma);
const analiseIaDocumentoRepository = new PrismaAnaliseIaDocumentoRepository(prisma);
const contratoRepository = new PrismaContratoRepository(prisma);
const contratoSignatarioRepository = new PrismaContratoSignatarioRepository(prisma);
const signatarioPadraoRepository = new PrismaSignatarioPadraoRepository(prisma);
const contratoEmailFalhaEntregaRepository = new PrismaContratoEmailFalhaEntregaRepository(prisma);
// Mesmo critério do FileStorage: GCS real quando GCS_BUCKET_NAME está
// configurada, senão lê do disco local (uploads/).
const documentoArquivoService = process.env.GCS_BUCKET_NAME
  ? new GcsDocumentoArquivoAdapter()
  : new LocalDocumentoArquivoAdapter();
// Mesmo critério dos outros adapters externos: Resend real quando
// RESEND_API_KEY está configurada, senão só loga (ver ConsoleEmailAdapter).
const emailSender = process.env.RESEND_API_KEY
  ? new ResendEmailAdapter()
  : new ConsoleEmailAdapter();
// Mesma regra do controller público: D4Sign real quando D4SIGN_TOKEN_API
// está configurada, senão mock — antes ficava sempre no mock aqui, então
// aprovarComplementar nunca mandava contrato de verdade em produção.
const contratoAssinaturaService = process.env.D4SIGN_TOKEN_API
  ? new D4SignAdapter(signatarioPadraoRepository)
  : new MockD4SignService();

export const cadastroAdminController = {
  listarCadastros(filtros: ListarCadastrosFiltros) {
    const useCase = new ListarCadastrosUseCase(agenciaRepository);
    return useCase.execute(filtros);
  },

  obterDetalhe(id: string) {
    const useCase = new ObterDetalheAgenciaUseCase(agenciaRepository);
    return useCase.execute(id);
  },

  obterDadosReceita(agenciaId: string) {
    const useCase = new ObterDadosReceitaUseCase(dadosReceitaRepository);
    return useCase.execute(agenciaId);
  },

  obterUsuarioMaster(agenciaId: string) {
    const useCase = new ObterUsuarioMasterUseCase(usuarioMasterRepository);
    return useCase.execute(agenciaId);
  },

  salvarUsuarioMaster(input: SalvarUsuarioMasterInput) {
    const useCase = new SalvarUsuarioMasterUseCase(usuarioMasterRepository);
    return useCase.execute(input);
  },

  aprovarComplementar(id: string) {
    const useCase = new AprovarCadastroComplementarUseCase(
      agenciaRepository,
      contratoAssinaturaService,
    );
    return useCase.execute(id);
  },

  marcarContratoAssinado(id: string) {
    const useCase = new MarcarContratoAssinadoUseCase(agenciaRepository);
    return useCase.execute(id);
  },

  atualizarStatus(input: AtualizarStatusCadastroInput) {
    const useCase = new AtualizarStatusCadastroUseCase(agenciaRepository);
    return useCase.execute(input);
  },

  salvarSica(input: SalvarSicaInput) {
    const useCase = new SalvarSicaUseCase(agenciaRepository);
    return useCase.execute(input);
  },

  salvarTravelLink(input: SalvarTravelLinkInput) {
    const useCase = new SalvarTravelLinkUseCase(agenciaRepository);
    return useCase.execute(input);
  },

  validarContrato(id: string) {
    return this.atualizarStatus({ id, status: STATUS_AGUARDANDO_ATIVACAO });
  },

  ativarCliente(id: string) {
    return this.atualizarStatus({ id, status: STATUS_ATIVO });
  },

  recusarCadastro(id: string) {
    return this.atualizarStatus({ id, status: STATUS_RECUSADO });
  },

  obterAnaliseContratos(dias: number) {
    const useCase = new ObterAnaliseContratosUseCase(agenciaRepository);
    return useCase.execute(dias);
  },

  obterCadastroComplementar(agenciaId: string) {
    const useCase = new ObterCadastroComplementarUseCase(cadastroComplementarRepository);
    return useCase.execute(agenciaId);
  },

  listarRepresentantesLegais(agenciaId: string) {
    const useCase = new ListarRepresentantesLegaisUseCase(representanteLegalRepository);
    return useCase.execute(agenciaId);
  },

  obterRepresentanteLegal(id: string) {
    const useCase = new ObterRepresentanteLegalUseCase(representanteLegalRepository);
    return useCase.execute(id);
  },

  obterEndereco(input: ObterEnderecoInput) {
    const useCase = new ObterEnderecoUseCase(enderecoRepository);
    return useCase.execute(input);
  },

  listarDocumentos(agenciaId: string) {
    const useCase = new ListarDocumentosUseCase(documentoRepository);
    return useCase.execute(agenciaId);
  },

  obterDocumento(id: string) {
    const useCase = new ObterDocumentoUseCase(documentoRepository);
    return useCase.execute(id);
  },

  obterAnaliseDocumento(documentoId: string) {
    const useCase = new ObterAnaliseIaDocumentoUseCase(analiseIaDocumentoRepository);
    return useCase.execute(documentoId);
  },

  aprovarDocumento(id: string) {
    const useCase = new AprovarDocumentoUseCase(documentoRepository);
    return useCase.execute(id);
  },

  reprovarDocumento(input: ReprovarDocumentoInput) {
    const useCase = new ReprovarDocumentoUseCase(documentoRepository);
    return useCase.execute(input);
  },

  obterArquivoDocumento(id: string) {
    const useCase = new ObterArquivoDocumentoUseCase(documentoRepository, documentoArquivoService);
    return useCase.execute(id);
  },

  solicitarReenvioDocumentos(input: SolicitarReenvioDocumentosInput) {
    const useCase = new SolicitarReenvioDocumentosUseCase(agenciaRepository, emailSender);
    return useCase.execute(input);
  },

  listarContratos(agenciaId: string) {
    const useCase = new ListarContratosUseCase(contratoRepository);
    return useCase.execute(agenciaId);
  },

  obterContrato(id: string) {
    const useCase = new ObterContratoUseCase(contratoRepository);
    return useCase.execute(id);
  },

  listarSignatariosContrato(contratoId: string) {
    const useCase = new ListarSignatariosContratoUseCase(contratoSignatarioRepository);
    return useCase.execute(contratoId);
  },

  listarEmailsFalhaEntregaContrato(contratoId: string) {
    const useCase = new ListarEmailsFalhaEntregaContratoUseCase(
      contratoEmailFalhaEntregaRepository,
    );
    return useCase.execute(contratoId);
  },

  listarSignatariosPadraoAtivos() {
    const useCase = new ListarSignatariosPadraoAtivosUseCase(signatarioPadraoRepository);
    return useCase.execute();
  },

  listarSignatariosPadrao() {
    const useCase = new ListarSignatariosPadraoUseCase(signatarioPadraoRepository);
    return useCase.execute();
  },

  obterSignatarioPadrao(id: string) {
    const useCase = new ObterSignatarioPadraoUseCase(signatarioPadraoRepository);
    return useCase.execute(id);
  },

  criarSignatarioPadrao(data: CreateSignatarioPadraoData) {
    const useCase = new CriarSignatarioPadraoUseCase(signatarioPadraoRepository);
    return useCase.execute(data);
  },

  atualizarSignatarioPadrao(input: AtualizarSignatarioPadraoInput) {
    const useCase = new AtualizarSignatarioPadraoUseCase(signatarioPadraoRepository);
    return useCase.execute(input);
  },

  removerSignatarioPadrao(id: string) {
    const useCase = new RemoverSignatarioPadraoUseCase(signatarioPadraoRepository);
    return useCase.execute(id);
  },

  restaurarSignatarioPadrao(id: string) {
    const useCase = new RestaurarSignatarioPadraoUseCase(signatarioPadraoRepository);
    return useCase.execute(id);
  },
};
