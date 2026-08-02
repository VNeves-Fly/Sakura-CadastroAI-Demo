import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { SstService } from "@/modules/cadastro/domain/services/sst-service";

export interface SalvarSicaInput {
  agenciaId: string;
  codigo: string;
  salvoPor: string;
}

// Confirma o código SICA digitado manualmente pelo analista contra o SST
// antes de salvar — busca por código (não por CNPJ, ver
// SstService.consultarSicaCodigoEmpresa) e cruza o CNPJ retornado com o da
// agência. Divergência (código de outra empresa, erro de digitação),
// código não encontrado, ou falha técnica na consulta → bloqueia o
// salvamento (decisão do usuário, 2026-08-02: melhor barrar do que
// associar o código errado a uma agência errada). Toda tentativa é
// registrada em ConsultaSst, mesmo quando bloqueia.
export class SalvarSicaUseCase implements UseCase<SalvarSicaInput, Agencia> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly sstService: SstService,
  ) {}

  async execute(input: SalvarSicaInput): Promise<Agencia> {
    const agencia = await this.agenciaRepository.findById(input.agenciaId);
    if (!agencia) {
      throw new NotFoundError("Agência");
    }

    const codigoEmpresa = Number(input.codigo);
    let resultado;
    try {
      resultado = await this.sstService.consultarSicaCodigoEmpresa(codigoEmpresa);
      await this.agenciaRepository.registrarConsultaSst(input.agenciaId, {
        sucesso: true,
        erro: null,
        metodo: "codigo_empresa",
        resultado,
        consultadoPor: input.salvoPor,
      });
    } catch (error) {
      await this.agenciaRepository.registrarConsultaSst(input.agenciaId, {
        sucesso: false,
        erro: String(error),
        metodo: "codigo_empresa",
        resultado: null,
        consultadoPor: input.salvoPor,
      });
      throw new DomainError("Não foi possível confirmar o código SICA no SST — tente novamente.");
    }

    if (!resultado.encontrado || resultado.registro?.cnpj !== agencia.cnpj) {
      throw new DomainError(
        "O código SICA informado não corresponde ao CNPJ desta agência no SST — confira o código.",
      );
    }

    return this.agenciaRepository.salvarSica(input.agenciaId, {
      codigo: input.codigo,
      salvoPor: input.salvoPor,
    });
  }
}
