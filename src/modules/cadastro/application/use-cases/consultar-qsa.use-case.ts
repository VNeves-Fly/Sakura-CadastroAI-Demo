import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { QsaConsultaService } from "@/modules/cadastro/domain/services/qsa-consulta-service";
import type {
  ConsultarQsaInput,
  ConsultarQsaOutput,
} from "@/modules/cadastro/application/dto/consultar-qsa.dto";

export class ConsultarQsaUseCase implements UseCase<ConsultarQsaInput, ConsultarQsaOutput> {
  constructor(private readonly qsaConsultaService: QsaConsultaService) {}

  async execute(input: ConsultarQsaInput): Promise<ConsultarQsaOutput> {
    const resultado = await this.qsaConsultaService.consultar(input.cnpj);

    if (!resultado) {
      throw new NotFoundError("Consulta QSA");
    }

    return resultado;
  }
}
