import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  ContratoAssinaturaRepository,
  ContratoPendenteGestor,
} from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";

export interface ListarContratosPendentesGestorInput {
  email: string;
}

// Tela "Contratos pendentes de assinatura" — pros signatários fixos da
// Sakura (gestores), sem gate de Legitimuz (só os sócios passam por
// biometria, ver docs/legitimuz/). Lista qualquer contrato onde esse
// e-mail é destinatário conhecido e ainda não assinou, independente da
// agência ter o fluxo paralelo ligado ou não.
export class ListarContratosPendentesGestorUseCase implements UseCase<
  ListarContratosPendentesGestorInput,
  ContratoPendenteGestor[]
> {
  constructor(private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository) {}

  async execute(input: ListarContratosPendentesGestorInput): Promise<ContratoPendenteGestor[]> {
    return this.contratoAssinaturaRepository.findPendentesPorEmail(input.email);
  }
}
