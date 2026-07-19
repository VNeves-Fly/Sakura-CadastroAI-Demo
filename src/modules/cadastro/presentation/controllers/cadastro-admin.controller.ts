import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { PrismaCadastroComplementarRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-cadastro-complementar.repository";
import { PrismaRepresentanteLegalRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-representante-legal.repository";
import { PrismaEnderecoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-endereco.repository";
import { PrismaDocumentoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-documento.repository";
import { PrismaContratoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato.repository";
import { PrismaContratoSignatarioRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato-signatario.repository";
import { PrismaSignatarioPadraoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-signatario-padrao.repository";
import { PrismaContratoEmailFalhaEntregaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato-email-falha-entrega.repository";
import { MockD4SignService } from "@/modules/cadastro/infrastructure/adapters/mock-d4sign.adapter";
import { D4SignAdapter } from "@/modules/cadastro/infrastructure/adapters/d4sign.adapter";
import { ListarCadastrosUseCase } from "@/modules/cadastro/application/use-cases/listar-cadastros.use-case";
import { ObterDetalheAgenciaUseCase } from "@/modules/cadastro/application/use-cases/obter-detalhe-agencia.use-case";
import { AprovarCadastroComplementarUseCase } from "@/modules/cadastro/application/use-cases/aprovar-cadastro-complementar.use-case";
import { MarcarContratoAssinadoUseCase } from "@/modules/cadastro/application/use-cases/marcar-contrato-assinado.use-case";
import { ObterAnaliseContratosUseCase } from "@/modules/cadastro/application/use-cases/obter-analise-contratos.use-case";
import {
  AtualizarStatusCadastroUseCase,
  type AtualizarStatusCadastroInput,
} from "@/modules/cadastro/application/use-cases/atualizar-status-cadastro.use-case";
import { ObterCadastroComplementarUseCase } from "@/modules/cadastro/application/use-cases/obter-cadastro-complementar.use-case";
import { ListarRepresentantesLegaisUseCase } from "@/modules/cadastro/application/use-cases/listar-representantes-legais.use-case";
import { ObterRepresentanteLegalUseCase } from "@/modules/cadastro/application/use-cases/obter-representante-legal.use-case";
import {
  ObterEnderecoUseCase,
  type ObterEnderecoInput,
} from "@/modules/cadastro/application/use-cases/obter-endereco.use-case";
import { ListarDocumentosUseCase } from "@/modules/cadastro/application/use-cases/listar-documentos.use-case";
import { ObterDocumentoUseCase } from "@/modules/cadastro/application/use-cases/obter-documento.use-case";
import { ListarContratosUseCase } from "@/modules/cadastro/application/use-cases/listar-contratos.use-case";
import { ObterContratoUseCase } from "@/modules/cadastro/application/use-cases/obter-contrato.use-case";
import { ListarSignatariosContratoUseCase } from "@/modules/cadastro/application/use-cases/listar-signatarios-contrato.use-case";
import { ListarEmailsFalhaEntregaContratoUseCase } from "@/modules/cadastro/application/use-cases/listar-emails-falha-entrega-contrato.use-case";
import { ListarSignatariosPadraoAtivosUseCase } from "@/modules/cadastro/application/use-cases/listar-signatarios-padrao-ativos.use-case";
import {
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_ATIVO,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ListarCadastrosFiltros } from "@/modules/cadastro/domain/repositories/agencia-repository";

// Composition root do módulo cadastro (área Admin) — mesmo domínio do
// controller público (Agencia), só que pra leitura/gestão interna.
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const cadastroComplementarRepository = new PrismaCadastroComplementarRepository(prisma);
const representanteLegalRepository = new PrismaRepresentanteLegalRepository(prisma);
const enderecoRepository = new PrismaEnderecoRepository(prisma);
const documentoRepository = new PrismaDocumentoRepository(prisma);
const contratoRepository = new PrismaContratoRepository(prisma);
const contratoSignatarioRepository = new PrismaContratoSignatarioRepository(prisma);
const signatarioPadraoRepository = new PrismaSignatarioPadraoRepository(prisma);
const contratoEmailFalhaEntregaRepository = new PrismaContratoEmailFalhaEntregaRepository(prisma);
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
};
