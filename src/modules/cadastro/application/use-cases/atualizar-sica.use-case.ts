import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { SstService } from "@/modules/cadastro/domain/services/sst-service";

export interface AtualizarSicaInput {
  agenciaId: string;
  atualizadoPor: string;
}

// Atualiza a situação do código SICA já confirmado (botão "Atualizar" no
// dossiê, ao lado do código salvo) — refaz a consulta ao SST pelo mesmo
// código (metodo "codigo_empresa"), útil pra saber se a empresa mudou de
// ativo pra inativo (ou vice-versa) depois da confirmação inicial.
// Tolerante a falha técnica (mesmo espírito de ConsultarSicaUseCase): nunca
// deixa a chamada estourar, sempre grava uma linha de auditoria.
export class AtualizarSicaUseCase implements UseCase<AtualizarSicaInput, void> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly sstService: SstService,
  ) {}

  async execute({ agenciaId, atualizadoPor }: AtualizarSicaInput): Promise<void> {
    const agencia = await this.agenciaRepository.findById(agenciaId);
    if (!agencia) {
      throw new NotFoundError("Agência");
    }
    if (!agencia.sicaCodigo) {
      throw new DomainError("Esta agência ainda não tem um código SICA salvo.");
    }

    try {
      const resultado = await this.sstService.consultarSicaCodigoEmpresa(
        Number(agencia.sicaCodigo),
      );
      await this.agenciaRepository.registrarConsultaSst(agenciaId, {
        sucesso: true,
        erro: null,
        metodo: "codigo_empresa",
        resultado,
        consultadoPor: atualizadoPor,
      });
    } catch (error) {
      await this.agenciaRepository.registrarConsultaSst(agenciaId, {
        sucesso: false,
        erro: String(error),
        metodo: "codigo_empresa",
        resultado: null,
        consultadoPor: atualizadoPor,
      });
    }
  }
}
