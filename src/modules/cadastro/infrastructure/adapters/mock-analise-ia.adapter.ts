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
// revisão manual em vez de aprovar direto.
//
// A integração real já existe (`FlysakuraAnaliseIaAdapter`, mesmo pasta) e
// chama POST /api/v1/agency-analysis/json do agents.flysakura.com com
// focus=completo (CNPJ + sócios + documentos já enviados no wizard). Só
// não está plugada no composition root ainda porque falta a credencial
// (AGENCY_ANALYSIS_API_KEY) — ver comentário no topo daquele arquivo pra
// trocar quando ela existir.
export class MockAnaliseIaService implements AnaliseIaService {
  async avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado> {
    const aprovado = validarDigitoVerificador(input.cnpj);

    return {
      aprovado,
      motivo: aprovado ? null : "CNPJ com dígito verificador inválido — necessário revisão manual.",
    };
  }
}
