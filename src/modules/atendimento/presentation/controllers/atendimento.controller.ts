import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { LocalFileStorage } from "@/modules/cadastro/infrastructure/adapters/local-file-storage.adapter";
import { GcsFileStorage } from "@/modules/cadastro/infrastructure/adapters/gcs-file-storage.adapter";
import { LocalDocumentoArquivoAdapter } from "@/modules/cadastro/infrastructure/adapters/local-documento-arquivo.adapter";
import { GcsDocumentoArquivoAdapter } from "@/modules/cadastro/infrastructure/adapters/gcs-documento-arquivo.adapter";
import { PrismaConversaRepository } from "@/modules/atendimento/infrastructure/repositories/prisma-conversa.repository";
import { PrismaMensagemRepository } from "@/modules/atendimento/infrastructure/repositories/prisma-mensagem.repository";
import { PrismaAssumirAtendimentoRepository } from "@/modules/atendimento/infrastructure/repositories/prisma-assumir-atendimento.repository";
import { PrismaTextoProntoRepository } from "@/modules/atendimento/infrastructure/repositories/prisma-texto-pronto.repository";
import { PrismaTemplateWhatsAppRepository } from "@/modules/atendimento/infrastructure/repositories/prisma-template-whatsapp.repository";
import { PrismaResumoFichaClienteRepository } from "@/modules/atendimento/infrastructure/repositories/prisma-resumo-ficha-cliente.repository";
import { MetaWhatsAppAdapter } from "@/modules/atendimento/infrastructure/adapters/meta-whatsapp.adapter";
import { MockWhatsAppMessagingAdapter } from "@/modules/atendimento/infrastructure/adapters/mock-whatsapp-messaging.adapter";
import { WhatsAppContactMatcherAdapter } from "@/modules/atendimento/infrastructure/adapters/whatsapp-contact-matcher.adapter";
import { ListarConversasUseCase } from "@/modules/atendimento/application/use-cases/listar-conversas.use-case";
import { ListarTemplatesAprovadosUseCase } from "@/modules/atendimento/application/use-cases/listar-templates-aprovados.use-case";
import { ListarTextosProntosUseCase } from "@/modules/atendimento/application/use-cases/listar-textos-prontos.use-case";
import { CriarTextoProntoUseCase } from "@/modules/atendimento/application/use-cases/criar-texto-pronto.use-case";
import { MarcarComoLidaUseCase } from "@/modules/atendimento/application/use-cases/marcar-como-lida.use-case";
import { EnviarMensagemUseCase } from "@/modules/atendimento/application/use-cases/enviar-mensagem.use-case";
import { AssumirAtendimentoUseCase } from "@/modules/atendimento/application/use-cases/assumir-atendimento.use-case";
import { SincronizarTemplatesWhatsAppUseCase } from "@/modules/atendimento/application/use-cases/sincronizar-templates-whatsapp.use-case";
import { ObterArquivoMidiaUseCase } from "@/modules/atendimento/application/use-cases/obter-arquivo-midia.use-case";
import type { EnviarMensagemInput } from "@/modules/atendimento/application/dto/enviar-mensagem.dto";
import type { AssumirAtendimentoInput } from "@/modules/atendimento/application/dto/assumir-atendimento.dto";
import type { CriarTextoProntoInput } from "@/modules/atendimento/application/dto/criar-texto-pronto.dto";

// Composition root do módulo atendimento — único lugar que conhece
// Prisma/FileStorage/Meta concretos. Mesmo padrão de
// cadastro-publico.controller.ts: FileStorage usa GCS quando
// GCS_BUCKET_NAME está configurada (mesma variável, mesmo bucket do
// módulo cadastro — mídia do WhatsApp fica em atendimento/{conversaId}/…
// dentro dele); WhatsAppMessagingService usa a Meta real quando
// WHATSAPP_ACCESS_TOKEN está configurada, senão cai pro mock.
const conversaRepository = new PrismaConversaRepository(prisma);
const mensagemRepository = new PrismaMensagemRepository(prisma);
const assumirAtendimentoRepository = new PrismaAssumirAtendimentoRepository(prisma);
const textoProntoRepository = new PrismaTextoProntoRepository(prisma);
const templateWhatsAppRepository = new PrismaTemplateWhatsAppRepository(prisma);
const resumoFichaClienteRepository = new PrismaResumoFichaClienteRepository(prisma);
const contactMatcher = new WhatsAppContactMatcherAdapter(prisma);
const fileStorage = process.env.GCS_BUCKET_NAME ? new GcsFileStorage() : new LocalFileStorage();
const documentoArquivoService = process.env.GCS_BUCKET_NAME
  ? new GcsDocumentoArquivoAdapter()
  : new LocalDocumentoArquivoAdapter();
const whatsAppMessagingService = process.env.WHATSAPP_ACCESS_TOKEN
  ? new MetaWhatsAppAdapter()
  : new MockWhatsAppMessagingAdapter();

export const atendimentoController = {
  listarConversas() {
    const useCase = new ListarConversasUseCase(conversaRepository, resumoFichaClienteRepository);
    return useCase.execute();
  },

  listarTemplatesAprovados() {
    const useCase = new ListarTemplatesAprovadosUseCase(templateWhatsAppRepository);
    return useCase.execute();
  },

  listarTextosProntos() {
    const useCase = new ListarTextosProntosUseCase(textoProntoRepository);
    return useCase.execute();
  },

  criarTextoPronto(input: CriarTextoProntoInput) {
    const useCase = new CriarTextoProntoUseCase(textoProntoRepository);
    return useCase.execute(input);
  },

  marcarComoLida(conversaId: string) {
    const useCase = new MarcarComoLidaUseCase(
      conversaRepository,
      mensagemRepository,
      resumoFichaClienteRepository,
    );
    return useCase.execute(conversaId);
  },

  enviarMensagem(input: EnviarMensagemInput) {
    const useCase = new EnviarMensagemUseCase(
      conversaRepository,
      mensagemRepository,
      templateWhatsAppRepository,
      whatsAppMessagingService,
    );
    return useCase.execute(input);
  },

  assumirAtendimento(input: AssumirAtendimentoInput) {
    const useCase = new AssumirAtendimentoUseCase(
      assumirAtendimentoRepository,
      conversaRepository,
      resumoFichaClienteRepository,
    );
    return useCase.execute(input);
  },

  sincronizarTemplates() {
    const useCase = new SincronizarTemplatesWhatsAppUseCase(
      whatsAppMessagingService,
      templateWhatsAppRepository,
    );
    return useCase.execute();
  },

  obterArquivoMidia(midiaId: string) {
    const useCase = new ObterArquivoMidiaUseCase(mensagemRepository, documentoArquivoService);
    return useCase.execute(midiaId);
  },
};

// Exportado à parte pro webhook (composition root próprio, ver
// webhook-whatsapp.controller.ts) reaproveitar sem duplicar as instâncias
// acima.
export const atendimentoInfra = {
  conversaRepository,
  mensagemRepository,
  contactMatcher,
  whatsAppMessagingService,
  fileStorage,
};
