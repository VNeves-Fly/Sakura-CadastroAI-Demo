import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  AgenciaRepository,
  AgenciaResumoPromotor,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

// Leitura cross-módulo (atribuições → cadastro) por natureza: a "ficha
// de colaborador" é uma tela de relatório que combina identidade do
// promotor com as agências que ele trouxe, não uma escrita no domínio
// de cadastro — mesmo tipo de composição que o dossiê do admin já faz
// com vários repositories de módulos diferentes.
export class ListarAgenciasPorPromotorUseCase implements UseCase<string, AgenciaResumoPromotor[]> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(promotorId: string): Promise<AgenciaResumoPromotor[]> {
    return this.agenciaRepository.listarPorExecutivoId(promotorId);
  }
}
