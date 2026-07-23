import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  Banco,
  BancoConsultaService,
} from "@/modules/cadastro/domain/services/banco-consulta-service";

export class ListarBancosUseCase implements UseCase<void, Banco[]> {
  constructor(private readonly bancoConsultaService: BancoConsultaService) {}

  async execute(): Promise<Banco[]> {
    return this.bancoConsultaService.listar();
  }
}
