import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { QsaConsultaService } from "@/modules/cadastro/domain/services/qsa-consulta-service";
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

    const agencia = await this.agenciaRepository.create({
      razaoSocial,
      cnpj: input.cnpj,
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
    });

    return {
      id: agencia.id,
      cnpj: agencia.cnpj,
      razaoSocial: agencia.razaoSocial,
      status: agencia.status,
    };
  }
}
