import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { QsaConsultaService } from "@/modules/cadastro/domain/services/qsa-consulta-service";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { AnaliseIaService } from "@/modules/cadastro/domain/services/analise-ia-service";
import type {
  FinalizarCadastroInput,
  FinalizarCadastroOutput,
} from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

export class FinalizarCadastroUseCase implements UseCase<
  FinalizarCadastroInput,
  FinalizarCadastroOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly fileStorage: FileStorage,
    private readonly qsaConsultaService: QsaConsultaService,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
    private readonly analiseIaService: AnaliseIaService,
  ) {}

  async execute(input: FinalizarCadastroInput): Promise<FinalizarCadastroOutput> {
    const existingAgencia = await this.agenciaRepository.findByCnpj(input.cnpj);

    if (existingAgencia) {
      throw new ConflictError("Esta agência já está cadastrada.");
    }

    // Reconsulta o QSA no servidor pra ter a razão social a partir de
    // uma fonte autoritativa, em vez de confiar no que o cliente enviou.
    const qsaResult = await this.qsaConsultaService.consultar(input.cnpj);
    const razaoSocial = qsaResult?.razaoSocial ?? input.cnpj;

    const contratoSocialPath = await this.fileStorage.save(
      input.contratoSocial,
      `agencias/${input.cnpj}/contrato-social`,
    );

    const socios = await Promise.all(
      input.socios.map(async (socio, index) => {
        const rgPath = await this.fileStorage.save(
          socio.rg,
          `agencias/${input.cnpj}/socio-${index}-rg`,
        );

        const procuracaoPath = socio.procuracao
          ? await this.fileStorage.save(
              socio.procuracao,
              `agencias/${input.cnpj}/socio-${index}-procuracao`,
            )
          : null;

        return {
          nome: socio.nome,
          cpf: socio.cpf,
          email: socio.email,
          telefone: socio.telefone,
          estadoCivil: socio.estadoCivil,
          endereco: socio.endereco,
          isRepresentante: socio.isRepresentante,
          rgPath,
          procuracaoPath,
        };
      }),
    );

    const signatarios = socios.map((socio) => ({
      nome: socio.nome,
      email: socio.email,
      cpf: socio.cpf,
    }));

    // A IA avalia o cadastro logo no envio: se achar algo errado, o caso
    // vai pra fila "em_complementar" (revisão manual, sem contrato ainda
    // — um analista entra em contato por telefone/e-mail); se estiver
    // tudo certo, gera e envia o contrato na hora (fila
    // "aguardando_assinatura"). Chamado antes de gravar no banco: se o
    // D4Sign falhar quando a IA aprova, nada é persistido.
    const analiseIa = await this.analiseIaService.avaliar({ cnpj: input.cnpj });

    const contratoResult = analiseIa.aprovado
      ? await this.contratoAssinaturaService.gerarEEnviar({
          cnpj: input.cnpj,
          razaoSocial,
          signatarios,
        })
      : null;

    const agencia = await this.agenciaRepository.create({
      razaoSocial,
      cnpj: input.cnpj,
      status: contratoResult ? STATUS_AGUARDANDO_ASSINATURA : STATUS_EM_COMPLEMENTAR,
      contratoSocialPath,
      emailContato: input.emailOperacional,
      telefoneContato: input.telefoneComercial,
      origem: input.origem,
      dadosComplementares: {
        empresa: {
          telefoneComercial: input.telefoneComercial,
          emailOperacional: input.emailOperacional,
          emailComercial: input.emailComercial,
          emailFinanceiro: input.emailFinanceiro,
        },
        socios,
        enderecoBanco: input.enderecoBanco,
      },
      contrato: contratoResult
        ? {
            provedorId: contratoResult.provedorId,
            status: contratoResult.status,
            origemGeracao: "ia",
            signatarios,
          }
        : null,
    });

    return {
      id: agencia.id,
      cnpj: agencia.cnpj,
      razaoSocial: agencia.razaoSocial,
      status: agencia.status,
      precisaRevisaoManual: !analiseIa.aprovado,
      contratoStatus: contratoResult?.status ?? null,
    };
  }
}
