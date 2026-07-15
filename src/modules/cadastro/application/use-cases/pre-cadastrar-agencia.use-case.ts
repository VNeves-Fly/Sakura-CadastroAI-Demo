import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError } from "@/modules/shared/domain/errors";
import { normalizarNome } from "@/modules/shared/utils/normalizar-nome";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { QsaConsultaService } from "@/modules/cadastro/domain/services/qsa-consulta-service";
import type { Socio } from "@/modules/cadastro/domain/entities/socio";
import type {
  PreCadastrarAgenciaInput,
  PreCadastrarAgenciaOutput,
} from "@/modules/cadastro/application/dto/pre-cadastrar-agencia.dto";

export class PreCadastrarAgenciaUseCase implements UseCase<
  PreCadastrarAgenciaInput,
  PreCadastrarAgenciaOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly fileStorage: FileStorage,
    private readonly qsaConsultaService: QsaConsultaService,
  ) {}

  async execute(input: PreCadastrarAgenciaInput): Promise<PreCadastrarAgenciaOutput> {
    const existingAgencia = await this.agenciaRepository.findByCnpj(input.cnpj);

    if (existingAgencia) {
      throw new ConflictError("Esta agência já está cadastrada.");
    }

    const qsaResult = await this.qsaConsultaService.consultar(input.cnpj);

    if (qsaResult) {
      const nomesQsa = qsaResult.socios.map((socio) => normalizarNome(socio.nome));
      const nomesDivergentes = input.socios
        .filter((socio) => !nomesQsa.includes(normalizarNome(socio.nome)))
        .map((socio) => socio.nome);

      if (nomesDivergentes.length > 0) {
        throw new DomainError(
          `Envio bloqueado — nomes divergentes do QSA: ${nomesDivergentes.join(", ")}.`,
        );
      }
    }

    const contratoSocialPath = await this.fileStorage.save(
      input.contratoSocial,
      `agencias/${input.cnpj}/contrato-social`,
    );

    const socios: Socio[] = await Promise.all(
      input.socios.map(async (socio, index) => {
        const rgPath = await this.fileStorage.save(
          socio.rg,
          `agencias/${input.cnpj}/socio-${index}-rg`,
        );

        return {
          nome: socio.nome,
          email: socio.email,
          telefone: socio.telefone,
          rgPath,
          qsaConfirmado: qsaResult !== null,
        };
      }),
    );

    const primeiroSocio = input.socios[0];

    if (!primeiroSocio) {
      throw new DomainError("Adicione ao menos um sócio.");
    }

    const agencia = await this.agenciaRepository.create({
      razaoSocial: qsaResult?.razaoSocial ?? input.cnpj,
      cnpj: input.cnpj,
      contratoSocialPath,
      emailContato: primeiroSocio.email,
      telefoneContato: primeiroSocio.telefone,
      origem: input.origem,
      socios,
    });

    return {
      id: agencia.id,
      cnpj: agencia.cnpj,
      razaoSocial: agencia.razaoSocial,
      status: agencia.status,
    };
  }
}
