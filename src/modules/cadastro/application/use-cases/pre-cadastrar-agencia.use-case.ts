import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError } from "@/modules/shared/domain/errors";
import { normalizarNome } from "@/modules/shared/utils/normalizar-nome";
import type {
  AgenciaRepository,
  CreateAgenciaSocioData,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { QsaConsultaService } from "@/modules/cadastro/domain/services/qsa-consulta-service";
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

    const primeiroSocio = input.socios[0];

    if (!primeiroSocio) {
      throw new DomainError("Adicione ao menos um sócio.");
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

    // Sócio validado contra o QSA da Receita ou preenchido manualmente —
    // mesma semântica de `RepresentanteLegal.origem` usada pelo restante do
    // domínio (Etapas 2/3), não um campo próprio deste fluxo.
    const origemSocio = qsaResult !== null ? "qsa_receita" : "manual";

    const contratoSocialPath = await this.fileStorage.save(
      input.contratoSocial,
      `cadastros/${input.cnpj}/contrato-social`,
    );

    const socios: CreateAgenciaSocioData[] = await Promise.all(
      input.socios.map(async (socio, index) => {
        const rgPath = await this.fileStorage.save(
          socio.rg,
          `cadastros/${input.cnpj}/socio-${index}-rg`,
        );

        return {
          nome: socio.nome,
          email: socio.email,
          telefone: socio.telefone,
          origem: origemSocio,
          rgDocumento: {
            fileName: socio.rg.originalName,
            mimeType: socio.rg.mimeType,
            path: rgPath,
            size: socio.rg.buffer.length,
          },
        };
      }),
    );

    const agencia = await this.agenciaRepository.create({
      razaoSocial: qsaResult?.razaoSocial ?? input.cnpj,
      cnpj: input.cnpj,
      email: primeiroSocio.email,
      telefone: primeiroSocio.telefone,
      origem: input.origem,
      contratoSocialDocumento: {
        fileName: input.contratoSocial.originalName,
        mimeType: input.contratoSocial.mimeType,
        path: contratoSocialPath,
        size: input.contratoSocial.buffer.length,
      },
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
