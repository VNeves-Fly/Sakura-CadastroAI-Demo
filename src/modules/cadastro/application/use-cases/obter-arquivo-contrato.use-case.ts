import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { ContratoRepository } from "@/modules/cadastro/domain/repositories/contrato-repository";
import type {
  ArquivoContrato,
  ContratoAssinaturaService,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";

export class ObterArquivoContratoUseCase implements UseCase<string, ArquivoContrato> {
  constructor(
    private readonly contratoRepository: ContratoRepository,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
  ) {}

  async execute(contratoId: string): Promise<ArquivoContrato> {
    const contrato = await this.contratoRepository.findById(contratoId);

    if (!contrato) {
      throw new NotFoundError("Contrato");
    }

    return this.contratoAssinaturaService.visualizarDocumento(contrato.provedorId);
  }
}
