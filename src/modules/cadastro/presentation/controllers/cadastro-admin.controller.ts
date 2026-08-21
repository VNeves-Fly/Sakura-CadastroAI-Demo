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
import { PrismaContratoAssinaturaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato-assinatura.repository";
import { PrismaHistoricoEdicaoCadastroRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-historico-edicao-cadastro.repository";
import { PrismaObservacaoCadastroRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-observacao-cadastro.repository";
import { PrismaDecisaoHumanaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-decisao-humana.repository";
import { PrismaNotificacaoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-notificacao.repository";
import { MockD4SignService } from "@/modules/cadastro/infrastructure/adapters/mock-d4sign.adapter";
import { D4SignAdapter } from "@/modules/cadastro/infrastructure/adapters/d4sign.adapter";
import { MockAnaliseIaService } from "@/modules/cadastro/infrastructure/adapters/mock-analise-ia.adapter";
import { FlysakuraAnaliseIaAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter";
import { MockSofiaConsultaService } from "@/modules/cadastro/infrastructure/adapters/mock-sofia-consulta.adapter";
import { FlysakuraSofiaConsultaAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-sofia-consulta.adapter";
import { MockSstService } from "@/modules/cadastro/infrastructure/adapters/mock-sst.adapter";
import { FlysakuraSstAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-sst.adapter";
import { MockDocumentAnalysisService } from "@/modules/cadastro/infrastructure/adapters/mock-document-analysis.adapter";
import { FlysakuraDocumentAnalysisAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-document-analysis.adapter";
import { LocalFileStorage } from "@/modules/cadastro/infrastructure/adapters/local-file-storage.adapter";
import { GcsFileStorage } from "@/modules/cadastro/infrastructure/adapters/gcs-file-storage.adapter";
// Cross-módulo só aqui na composition root (nunca no domain/application):
// PrismaMensagemRepository (atendimento) satisfaz MidiaOrigemRepository
// (cadastro) estruturalmente, sem nenhuma das duas camadas de domínio
// conhecerem a outra — ver midia-origem-repository.ts.
import { PrismaMensagemRepository } from "@/modules/atendimento/infrastructure/repositories/prisma-mensagem.repository";
import { ListarDocumentosPendentesUseCase } from "@/modules/cadastro/application/use-cases/listar-documentos-pendentes.use-case";
import { VincularMidiaComoDocumentoUseCase } from "@/modules/cadastro/application/use-cases/vincular-midia-como-documento.use-case";
import type { VincularMidiaComoDocumentoInput } from "@/modules/cadastro/application/use-cases/vincular-midia-como-documento.use-case";
import { InserirDocumentoManualUseCase } from "@/modules/cadastro/application/use-cases/inserir-documento-manual.use-case";
import type { InserirDocumentoManualInput } from "@/modules/cadastro/application/use-cases/inserir-documento-manual.use-case";
import { EditarDadosEmpresaUseCase } from "@/modules/cadastro/application/use-cases/editar-dados-empresa.use-case";
import type { EditarDadosEmpresaInput } from "@/modules/cadastro/application/use-cases/editar-dados-empresa.use-case";
import {
  RegistrarObservacaoCadastroUseCase,
  type RegistrarObservacaoCadastroInput,
} from "@/modules/cadastro/application/use-cases/registrar-observacao-cadastro.use-case";
import { EditarDadosBancariosUseCase } from "@/modules/cadastro/application/use-cases/editar-dados-bancarios.use-case";
import type { EditarDadosBancariosInput } from "@/modules/cadastro/application/use-cases/editar-dados-bancarios.use-case";
import { ListarCadastrosUseCase } from "@/modules/cadastro/application/use-cases/listar-cadastros.use-case";
import { ObterDetalheAgenciaUseCase } from "@/modules/cadastro/application/use-cases/obter-detalhe-agencia.use-case";
import { ObterDadosReceitaUseCase } from "@/modules/cadastro/application/use-cases/obter-dados-receita.use-case";
import { ObterUsuarioMasterUseCase } from "@/modules/cadastro/application/use-cases/obter-usuario-master.use-case";
import {
  SalvarUsuarioMasterUseCase,
  type SalvarUsuarioMasterInput,
} from "@/modules/cadastro/application/use-cases/salvar-usuario-master.use-case";
import {
  AprovarCadastroComplementarUseCase,
  type AprovarCadastroComplementarInput,
} from "@/modules/cadastro/application/use-cases/aprovar-cadastro-complementar.use-case";
import { AnalisarCadastroUseCase } from "@/modules/cadastro/application/use-cases/analisar-cadastro.use-case";
import {
  ReconsultarCreditoUseCase,
  type ReconsultarCreditoInput,
} from "@/modules/cadastro/application/use-cases/reconsultar-credito.use-case";
import { MarcarContratoAssinadoUseCase } from "@/modules/cadastro/application/use-cases/marcar-contrato-assinado.use-case";
import { ObterAnaliseContratosUseCase } from "@/modules/cadastro/application/use-cases/obter-analise-contratos.use-case";
import { ObterKpisCadastroUseCase } from "@/modules/cadastro/application/use-cases/obter-kpis-cadastro.use-case";
import { ObterMetricasDashboardUseCase } from "@/modules/cadastro/application/use-cases/obter-metricas-dashboard.use-case";
import {
  AtualizarStatusCadastroUseCase,
  type AtualizarStatusCadastroInput,
} from "@/modules/cadastro/application/use-cases/atualizar-status-cadastro.use-case";
import {
  ForcarAvancoStatusUseCase,
  type ForcarAvancoStatusInput,
} from "@/modules/cadastro/application/use-cases/forcar-avanco-status.use-case";
import {
  CancelarContratoUseCase,
  type CancelarContratoInput,
} from "@/modules/cadastro/application/use-cases/cancelar-contrato.use-case";
import {
  RecusarCadastroUseCase,
  type RecusarCadastroInput,
} from "@/modules/cadastro/application/use-cases/recusar-cadastro.use-case";
import {
  SalvarSicaUseCase,
  type SalvarSicaInput,
} from "@/modules/cadastro/application/use-cases/salvar-sica.use-case";
import {
  ConsultarSicaUseCase,
  type ConsultarSicaInput,
} from "@/modules/cadastro/application/use-cases/consultar-sica.use-case";
import {
  AtualizarSicaUseCase,
  type AtualizarSicaInput,
} from "@/modules/cadastro/application/use-cases/atualizar-sica.use-case";
import { ConfirmarCadastramentoUseCase } from "@/modules/cadastro/application/use-cases/confirmar-cadastramento.use-case";
import {
  SalvarTravelLinkUseCase,
  type SalvarTravelLinkInput,
} from "@/modules/cadastro/application/use-cases/salvar-travel-link.use-case";
import { ObterCadastroComplementarUseCase } from "@/modules/cadastro/application/use-cases/obter-cadastro-complementar.use-case";
import { ListarRepresentantesLegaisUseCase } from "@/modules/cadastro/application/use-cases/listar-representantes-legais.use-case";
import { ObterRepresentanteLegalUseCase } from "@/modules/cadastro/application/use-cases/obter-representante-legal.use-case";
import {
  AtualizarRepresentanteLegalUseCase,
  type AtualizarRepresentanteLegalInput,
} from "@/modules/cadastro/application/use-cases/atualizar-representante-legal.use-case";
import {
  CriarRepresentanteLegalUseCase,
  type CriarRepresentanteLegalInput,
} from "@/modules/cadastro/application/use-cases/criar-representante-legal.use-case";
import {
  RemoverRepresentanteLegalUseCase,
  type RemoverRepresentanteLegalInput,
} from "@/modules/cadastro/application/use-cases/remover-representante-legal.use-case";
import {
  ObterEnderecoUseCase,
  type ObterEnderecoInput,
} from "@/modules/cadastro/application/use-cases/obter-endereco.use-case";
import { ListarDocumentosUseCase } from "@/modules/cadastro/application/use-cases/listar-documentos.use-case";
import { ObterDocumentoUseCase } from "@/modules/cadastro/application/use-cases/obter-documento.use-case";
import { ObterAnaliseIaDocumentoUseCase } from "@/modules/cadastro/application/use-cases/obter-analise-ia-documento.use-case";
import {
  AprovarDocumentoUseCase,
  type AprovarDocumentoInput,
} from "@/modules/cadastro/application/use-cases/aprovar-documento.use-case";
import {
  ReprovarDocumentoUseCase,
  type ReprovarDocumentoInput,
} from "@/modules/cadastro/application/use-cases/reprovar-documento.use-case";
import {
  ReanalisarDocumentoUseCase,
  type ReanalisarDocumentoInput,
} from "@/modules/cadastro/application/use-cases/reanalisar-documento.use-case";
import { ObterArquivoDocumentoUseCase } from "@/modules/cadastro/application/use-cases/obter-arquivo-documento.use-case";
import { LocalDocumentoArquivoAdapter } from "@/modules/cadastro/infrastructure/adapters/local-documento-arquivo.adapter";
import { GcsDocumentoArquivoAdapter } from "@/modules/cadastro/infrastructure/adapters/gcs-documento-arquivo.adapter";
import {
  SolicitarReenvioDocumentosUseCase,
  type SolicitarReenvioDocumentosInput,
} from "@/modules/cadastro/application/use-cases/solicitar-reenvio-documentos.use-case";
import { SmtpEmailAdapter } from "@/modules/shared/infrastructure/adapters/smtp-email.adapter";
import { ConsoleEmailAdapter } from "@/modules/shared/infrastructure/adapters/console-email.adapter";
import { ListarContratosUseCase } from "@/modules/cadastro/application/use-cases/listar-contratos.use-case";
import { ObterContratoUseCase } from "@/modules/cadastro/application/use-cases/obter-contrato.use-case";
import { ObterArquivoContratoUseCase } from "@/modules/cadastro/application/use-cases/obter-arquivo-contrato.use-case";
import { RegistrarContratoExternoUseCase } from "@/modules/cadastro/application/use-cases/registrar-contrato-externo.use-case";
import { ProcessarWebhookD4SignUseCase } from "@/modules/cadastro/application/use-cases/processar-webhook-d4sign.use-case";
import { ListarSignatariosContratoUseCase } from "@/modules/cadastro/application/use-cases/listar-signatarios-contrato.use-case";
import { SincronizarContratoD4SignUseCase } from "@/modules/cadastro/application/use-cases/sincronizar-contrato-d4sign.use-case";
import { ListarEmailsFalhaEntregaContratoUseCase } from "@/modules/cadastro/application/use-cases/listar-emails-falha-entrega-contrato.use-case";
import { ListarAssinaturasContratoUseCase } from "@/modules/cadastro/application/use-cases/listar-assinaturas-contrato.use-case";
import {
  ObterLinkAssinaturaUseCase,
  type ObterLinkAssinaturaInput,
} from "@/modules/cadastro/application/use-cases/obter-link-assinatura.use-case";
import { ListarSignatariosPadraoAtivosUseCase } from "@/modules/cadastro/application/use-cases/listar-signatarios-padrao-ativos.use-case";
import { ListarSignatariosPadraoUseCase } from "@/modules/cadastro/application/use-cases/listar-signatarios-padrao.use-case";
import { ObterSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/obter-signatario-padrao.use-case";
import {
  CriarSignatarioPadraoUseCase,
  type CriarSignatarioPadraoInput,
} from "@/modules/cadastro/application/use-cases/criar-signatario-padrao.use-case";
import { ReordenarSignatariosPadraoUseCase } from "@/modules/cadastro/application/use-cases/reordenar-signatarios-padrao.use-case";
import {
  AtualizarSignatarioPadraoUseCase,
  type AtualizarSignatarioPadraoInput,
} from "@/modules/cadastro/application/use-cases/atualizar-signatario-padrao.use-case";
import { RemoverSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/remover-signatario-padrao.use-case";
import { RestaurarSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/restaurar-signatario-padrao.use-case";
import { STATUS_ATIVO } from "@/modules/cadastro/domain/repositories/agencia-repository";
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
const contratoAssinaturaRepository = new PrismaContratoAssinaturaRepository(prisma);
const historicoEdicaoCadastroRepository = new PrismaHistoricoEdicaoCadastroRepository(prisma);
const observacaoCadastroRepository = new PrismaObservacaoCadastroRepository(prisma);
const decisaoHumanaRepository = new PrismaDecisaoHumanaRepository(prisma);
const notificacaoRepository = new PrismaNotificacaoRepository(prisma);
// Mesmo critério do FileStorage: GCS real quando GCS_BUCKET_NAME está
// configurada, senão lê do disco local (uploads/).
const documentoArquivoService = process.env.GCS_BUCKET_NAME
  ? new GcsDocumentoArquivoAdapter()
  : new LocalDocumentoArquivoAdapter();
const fileStorage = process.env.GCS_BUCKET_NAME ? new GcsFileStorage() : new LocalFileStorage();
const midiaOrigemRepository = new PrismaMensagemRepository(prisma);
// Mesmo critério dos outros adapters externos: SMTP real quando SMTP_HOST
// está configurada, senão só loga (ver ConsoleEmailAdapter).
const emailSender = process.env.SMTP_HOST ? new SmtpEmailAdapter() : new ConsoleEmailAdapter();
// Mesma regra do controller público: D4Sign real quando D4SIGN_TOKEN_API
// está configurada, senão mock — antes ficava sempre no mock aqui, então
// aprovarComplementar nunca mandava contrato de verdade em produção.
const contratoAssinaturaService = process.env.D4SIGN_TOKEN_API
  ? new D4SignAdapter(signatarioPadraoRepository)
  : new MockD4SignService();
// Mesmo critério do controller público: agente real quando
// AGENCY_ANALYSIS_API_KEY está configurada, senão mock — usado só pelo
// reprocessamento manual de análise (ver reprocessarAnalise).
const analiseIaService = process.env.AGENCY_ANALYSIS_API_KEY
  ? new FlysakuraAnaliseIaAdapter()
  : new MockAnaliseIaService();
// Mesmo critério acima — endpoint dedicado de SOFIA (ver
// ReconsultarCreditoUseCase), usado só pela reconsulta isolada de SOFIA no
// dossiê (ConsultaSofiaCard).
const sofiaConsultaService = process.env.AGENCY_ANALYSIS_API_KEY
  ? new FlysakuraSofiaConsultaAdapter()
  : new MockSofiaConsultaService();
// Domínio/credencial separados de agents.flysakura.com — verifica se a
// empresa já está no SICA (ver AnalisarCadastroUseCase/SalvarSicaUseCase/
// ConsultarSicaUseCase).
const sstService = process.env.SST_API_KEY ? new FlysakuraSstAdapter() : new MockSstService();
const documentAnalysisService = process.env.AGENCY_ANALYSIS_API_KEY
  ? new FlysakuraDocumentAnalysisAdapter()
  : new MockDocumentAnalysisService();

export const cadastroAdminController = {
  listarCadastros(filtros: ListarCadastrosFiltros) {
    const useCase = new ListarCadastrosUseCase(agenciaRepository);
    return useCase.execute(filtros);
  },

  obterDetalhe(id: string) {
    const useCase = new ObterDetalheAgenciaUseCase(agenciaRepository);
    return useCase.execute(id);
  },

  // Log de eventos "cliente enviou algo novo" (mensagem/documento — ver
  // ReceberMensagemWhatsAppUseCase e ReenviarDocumentoUseCase) — dossiê lê
  // isso pra saber o que mudou desde a última vez que quem atendia viu a
  // ficha (ver temAtualizacaoPendente).
  listarNotificacoes(agenciaId: string) {
    return notificacaoRepository.findByAgenciaId(agenciaId);
  },

  // Só chamar quando quem está abrindo o dossiê é o mesmo analista em
  // atendimento da agência (ver comentário no schema.prisma) — abrir sem
  // estar atendendo não deve "resolver" a atualização pendente.
  marcarAtualizacaoComoVista(agenciaId: string, analistaId: string) {
    return agenciaRepository.marcarAtualizacaoComoVista(agenciaId, analistaId);
  },

  // Marcação manual da tag "info pendente" (ver comentário no
  // schema.prisma) — pro caso do analista estar esperando algo da agência
  // por um canal que não passa por SolicitarReenvioDocumentosUseCase
  // (ligação, e-mail avulso etc.). Mesmo método usado pelo caminho
  // automático — não precisa de rastro de quem ligou, só de quem tirou
  // (ver desmarcarInfoPendente).
  marcarInfoPendente(agenciaId: string) {
    return agenciaRepository.marcarInfoPendente(agenciaId);
  },

  // Remoção manual da tag "info pendente" (ver comentário no
  // schema.prisma) — grava quem/quando pra deixar rastro.
  desmarcarInfoPendente(agenciaId: string, analistaId: string) {
    return agenciaRepository.desmarcarInfoPendente(agenciaId, analistaId);
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

  aprovarComplementar(input: AprovarCadastroComplementarInput) {
    const useCase = new AprovarCadastroComplementarUseCase(
      agenciaRepository,
      contratoAssinaturaService,
      decisaoHumanaRepository,
      contratoAssinaturaRepository,
    );
    return useCase.execute(input);
  },

  // Auditoria das decisões manuais (ver AprovarCadastroComplementarUseCase)
  // — mais recente primeiro (ver PrismaDecisaoHumanaRepository).
  listarDecisoesHumanas(agenciaId: string) {
    return decisaoHumanaRepository.findByAgenciaId(agenciaId);
  },

  // Reprocessa a análise de IA de um cadastro travado em "em_analise"
  // (ex.: o processo caiu no meio da análise assíncrona, ou a chamada à
  // IA falhou tecnicamente) — reentrante, roda o mesmo pipeline do envio
  // automático (ver AnalisarCadastroUseCase).
  reprocessarAnalise(id: string) {
    const useCase = new AnalisarCadastroUseCase(
      agenciaRepository,
      contratoAssinaturaService,
      analiseIaService,
      documentAnalysisService,
      dadosReceitaRepository,
      documentoRepository,
      sstService,
      contratoAssinaturaRepository,
    );
    return useCase.execute({ agenciaId: id });
  },

  // Reconsulta isolada de AMAT ou SOFIA (ver ConsultaAmatCard/
  // ConsultaSofiaCard) — não usa AnalisarCadastroUseCase de propósito:
  // não deve reanalisar documentos nem mudar Agencia.status.
  reconsultarCredito(input: ReconsultarCreditoInput) {
    const useCase = new ReconsultarCreditoUseCase(
      agenciaRepository,
      analiseIaService,
      sofiaConsultaService,
    );
    return useCase.execute(input);
  },

  marcarContratoAssinado(id: string, marcadoPor: string) {
    const useCase = new MarcarContratoAssinadoUseCase(agenciaRepository);
    return useCase.execute({ id, marcadoPor });
  },

  atualizarStatus(input: AtualizarStatusCadastroInput) {
    const useCase = new AtualizarStatusCadastroUseCase(agenciaRepository);
    return useCase.execute(input);
  },

  salvarSica(input: SalvarSicaInput) {
    const useCase = new SalvarSicaUseCase(agenciaRepository, sstService);
    return useCase.execute(input);
  },

  // Reconsulta manual do SST por CNPJ (ver ConsultaSicaCard) — mesma
  // checagem automática de AnalisarCadastroUseCase, disparável de novo a
  // qualquer momento pelo analista.
  consultarSica(input: ConsultarSicaInput) {
    const useCase = new ConsultarSicaUseCase(agenciaRepository, sstService);
    return useCase.execute(input);
  },

  // Atualiza a situação do código SICA já salvo (botão "Atualizar" na
  // ficha, ao lado do código) — busca de novo pelo código, não pelo CNPJ
  // (ver AtualizarSicaUseCase); diferente de consultarSica.
  atualizarSica(input: AtualizarSicaInput) {
    const useCase = new AtualizarSicaUseCase(agenciaRepository, sstService);
    return useCase.execute(input);
  },

  salvarTravelLink(input: SalvarTravelLinkInput) {
    const useCase = new SalvarTravelLinkUseCase(agenciaRepository);
    return useCase.execute(input);
  },

  // SICA/TravelLink cadastrados e SICA confirmado ativo no SST (etapa
  // "SICA/TL") — segue pra "aguardando_ativacao", onde falta só o Usuário
  // Master (ver ConfirmarCadastramentoUseCase).
  confirmarCadastramento(id: string, confirmadoPor: string) {
    const useCase = new ConfirmarCadastramentoUseCase(agenciaRepository);
    return useCase.execute({ agenciaId: id, confirmadoPor });
  },

  // Via de escape auditada pras duas transições que normalmente só
  // acontecem via webhook do D4Sign (ver ForcarAvancoStatusUseCase) —
  // pra quando a plataforma não conseguir fazer isso sozinha.
  forcarAvancoStatus(input: ForcarAvancoStatusInput) {
    const useCase = new ForcarAvancoStatusUseCase(
      agenciaRepository,
      historicoEdicaoCadastroRepository,
    );
    return useCase.execute(input);
  },

  // Analista desiste do contrato atual (dados errados, sócio pediu pra
  // recomeçar etc.) — cancela também no D4Sign e devolve pra complementar
  // (ver CancelarContratoUseCase).
  cancelarContrato(input: CancelarContratoInput) {
    const useCase = new CancelarContratoUseCase(
      agenciaRepository,
      contratoAssinaturaService,
      historicoEdicaoCadastroRepository,
    );
    return useCase.execute(input);
  },

  ativarCliente(id: string, usuarioEmail: string) {
    return this.atualizarStatus({ id, status: STATUS_ATIVO, usuarioEmail });
  },

  // Exige motivo (ver RecusarCadastroUseCase) — grava tanto no histórico
  // de etapa (observacao) quanto no HistoricoEdicaoCadastro, mesmo padrão
  // de quem/quando/por quê de cancelarContrato/forcarAvancoStatus.
  recusarCadastro(input: RecusarCadastroInput) {
    const useCase = new RecusarCadastroUseCase(
      agenciaRepository,
      historicoEdicaoCadastroRepository,
    );
    return useCase.execute(input);
  },

  obterAnaliseContratos(dias: number) {
    const useCase = new ObterAnaliseContratosUseCase(agenciaRepository);
    return useCase.execute(dias);
  },

  obterKpisCadastro() {
    const useCase = new ObterKpisCadastroUseCase(agenciaRepository);
    return useCase.execute();
  },

  obterMetricasDashboard() {
    const useCase = new ObterMetricasDashboardUseCase(agenciaRepository);
    return useCase.execute();
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

  atualizarRepresentanteLegal(input: AtualizarRepresentanteLegalInput) {
    const useCase = new AtualizarRepresentanteLegalUseCase(
      representanteLegalRepository,
      historicoEdicaoCadastroRepository,
    );
    return useCase.execute(input);
  },

  criarRepresentanteLegal(input: CriarRepresentanteLegalInput) {
    const useCase = new CriarRepresentanteLegalUseCase(representanteLegalRepository);
    return useCase.execute(input);
  },

  removerRepresentanteLegal(input: RemoverRepresentanteLegalInput) {
    const useCase = new RemoverRepresentanteLegalUseCase(
      representanteLegalRepository,
      historicoEdicaoCadastroRepository,
    );
    return useCase.execute(input);
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

  aprovarDocumento(input: AprovarDocumentoInput) {
    const useCase = new AprovarDocumentoUseCase(documentoRepository);
    return useCase.execute(input);
  },

  reprovarDocumento(input: ReprovarDocumentoInput) {
    const useCase = new ReprovarDocumentoUseCase(documentoRepository);
    return useCase.execute(input);
  },

  reanalisarDocumento(input: ReanalisarDocumentoInput) {
    const useCase = new ReanalisarDocumentoUseCase(documentoRepository);
    return useCase.execute(input);
  },

  obterArquivoDocumento(id: string) {
    const useCase = new ObterArquivoDocumentoUseCase(documentoRepository, documentoArquivoService);
    return useCase.execute(id);
  },

  listarDocumentosPendentes(agenciaId: string) {
    const useCase = new ListarDocumentosPendentesUseCase(agenciaRepository);
    return useCase.execute(agenciaId);
  },

  vincularMidiaComoDocumento(input: VincularMidiaComoDocumentoInput) {
    const useCase = new VincularMidiaComoDocumentoUseCase(
      documentoRepository,
      agenciaRepository,
      fileStorage,
      documentoArquivoService,
      midiaOrigemRepository,
    );
    return useCase.execute(input);
  },

  inserirDocumentoManual(input: InserirDocumentoManualInput) {
    const useCase = new InserirDocumentoManualUseCase(
      documentoRepository,
      agenciaRepository,
      fileStorage,
    );
    return useCase.execute(input);
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

  obterArquivoContrato(contratoId: string) {
    const useCase = new ObterArquivoContratoUseCase(contratoRepository, contratoAssinaturaService);
    return useCase.execute(contratoId);
  },

  listarSignatariosContrato(contratoId: string) {
    const useCase = new ListarSignatariosContratoUseCase(contratoSignatarioRepository);
    return useCase.execute(contratoId);
  },

  sincronizarContratoD4Sign(agenciaId: string, sincronizadoPor: string) {
    const useCase = new SincronizarContratoD4SignUseCase(
      agenciaRepository,
      contratoAssinaturaService,
      contratoSignatarioRepository,
      signatarioPadraoRepository,
      contratoAssinaturaRepository,
    );
    return useCase.execute({ agenciaId, sincronizadoPor });
  },

  listarEmailsFalhaEntregaContrato(contratoId: string) {
    const useCase = new ListarEmailsFalhaEntregaContratoUseCase(
      contratoEmailFalhaEntregaRepository,
    );
    return useCase.execute(contratoId);
  },

  listarAssinaturasContrato(contratoId: string) {
    const useCase = new ListarAssinaturasContratoUseCase(contratoAssinaturaRepository);
    return useCase.execute(contratoId);
  },

  // Link direto de assinatura de um destinatário (botão "Ver/copiar link"
  // na Fila de Assinatura) — ver ObterLinkAssinaturaUseCase.
  obterLinkAssinatura(input: ObterLinkAssinaturaInput) {
    const useCase = new ObterLinkAssinaturaUseCase(
      agenciaRepository,
      contratoAssinaturaRepository,
      contratoAssinaturaService,
    );
    return useCase.execute(input);
  },

  async registrarContratoExterno(input: {
    agenciaId: string;
    contratoId: string;
    provedorId: string;
  }) {
    // Mesma fonte de dados que dossie.view-model.ts usa pra montar a Fila
    // de Assinatura — sócios da agência + signatários fixos ativos — só
    // pra validar que o documento colado é o certo, ver
    // RegistrarContratoExternoUseCase.
    const [detalhe, signatariosPadraoAtivos] = await Promise.all([
      agenciaRepository.obterDetalhe(input.agenciaId),
      signatarioPadraoRepository.findAtivos(),
    ]);
    const emailsEsperados = [
      ...(detalhe?.representantesLegais
        .filter((socio) => socio.administrativo !== false)
        .map((socio) => socio.email) ?? []),
      ...signatariosPadraoAtivos
        .filter((padrao) => padrao.email)
        .map((padrao) => padrao.email as string),
    ];

    const processarWebhookUseCase = new ProcessarWebhookD4SignUseCase(
      agenciaRepository,
      signatarioPadraoRepository,
      contratoEmailFalhaEntregaRepository,
      contratoAssinaturaRepository,
      contratoSignatarioRepository,
    );
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      contratoAssinaturaService,
      processarWebhookUseCase,
    );
    return useCase.execute({
      contratoId: input.contratoId,
      provedorId: input.provedorId,
      emailsEsperados,
    });
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

  criarSignatarioPadrao(data: CriarSignatarioPadraoInput) {
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

  // Persiste a nova ordem da fila de assinatura (drag-and-drop na tela de
  // Signatários do Contrato) — ver ReordenarSignatariosPadraoUseCase.
  reordenarSignatariosPadrao(idsEmOrdem: string[]) {
    const useCase = new ReordenarSignatariosPadraoUseCase(signatarioPadraoRepository);
    return useCase.execute(idsEmOrdem);
  },

  listarHistoricoEdicoes(entidadeId: string) {
    return historicoEdicaoCadastroRepository.findByEntidadeId(entidadeId);
  },

  listarObservacoes(agenciaId: string) {
    return observacaoCadastroRepository.findByAgenciaId(agenciaId);
  },

  registrarObservacao(input: RegistrarObservacaoCadastroInput) {
    const useCase = new RegistrarObservacaoCadastroUseCase(
      observacaoCadastroRepository,
      agenciaRepository,
    );
    return useCase.execute(input);
  },

  editarDadosEmpresa(input: EditarDadosEmpresaInput) {
    const useCase = new EditarDadosEmpresaUseCase(
      agenciaRepository,
      cadastroComplementarRepository,
      enderecoRepository,
      historicoEdicaoCadastroRepository,
    );
    return useCase.execute(input);
  },

  editarDadosBancarios(input: EditarDadosBancariosInput) {
    const useCase = new EditarDadosBancariosUseCase(
      cadastroComplementarRepository,
      historicoEdicaoCadastroRepository,
    );
    return useCase.execute(input);
  },
};
