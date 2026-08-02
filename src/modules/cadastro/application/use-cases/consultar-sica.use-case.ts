import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { SstService } from "@/modules/cadastro/domain/services/sst-service";

export interface ConsultarSicaInput {
  agenciaId: string;
  consultadoPor: string;
}

// Reconsulta manual ao SST por CNPJ (botão "Reconsultar" no dossiê,
// ConsultaSicaCard) — mesma checagem que já roda automaticamente ao
// finalizar o cadastro (ver AnalisarCadastroUseCase), útil quando a
// automática falhou ou o analista quer confirmar de novo depois. Tolerante
// a falha: nunca deixa a chamada estourar pro controller, sempre grava uma
// linha de auditoria (sucesso ou erro).
export class ConsultarSicaUseCase implements UseCase<ConsultarSicaInput, void> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly sstService: SstService,
  ) {}

  async execute({ agenciaId, consultadoPor }: ConsultarSicaInput): Promise<void> {
    const agencia = await this.agenciaRepository.findById(agenciaId);
    if (!agencia) {
      throw new NotFoundError("Agência");
    }

    try {
      const resultado = await this.sstService.consultarSicaCNPJ(agencia.cnpj);
      await this.agenciaRepository.registrarConsultaSst(agenciaId, {
        sucesso: true,
        erro: null,
        metodo: "cnpj",
        resultado,
        consultadoPor,
      });
    } catch (error) {
      await this.agenciaRepository.registrarConsultaSst(agenciaId, {
        sucesso: false,
        erro: String(error),
        metodo: "cnpj",
        resultado: null,
        consultadoPor,
      });
    }
  }
}
