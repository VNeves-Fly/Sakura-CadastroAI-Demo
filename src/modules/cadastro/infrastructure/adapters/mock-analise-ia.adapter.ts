import { validarDigitoVerificador } from "@/modules/cadastro/utils/cnpj.util";
import type {
  AnaliseIaInput,
  AnaliseIaResultado,
  AnaliseIaService,
} from "@/modules/cadastro/domain/services/analise-ia-service";

// Sem integração real com IA/OCR ainda. Critério mock, determinístico e
// ligado a um sinal real já existente no projeto: dígito verificador do
// CNPJ. Se o CNPJ não fecha o checksum (hoje o front só avisa, não
// bloqueia o envio), a IA considera que "algo está errado" e manda pra
// revisão manual em vez de aprovar direto — trocar por uma integração
// real de análise documental depois não deve exigir mudar o use-case,
// só esta implementação.
export class MockAnaliseIaService implements AnaliseIaService {
  async avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado> {
    const aprovado = validarDigitoVerificador(input.cnpj);

    return {
      aprovado,
      motivo: aprovado ? null : "CNPJ com dígito verificador inválido — necessário revisão manual.",
    };
  }
}
