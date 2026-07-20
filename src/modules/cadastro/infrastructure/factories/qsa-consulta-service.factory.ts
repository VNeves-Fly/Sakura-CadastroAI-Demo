import type { QsaConsultaService } from "@/modules/cadastro/domain/services/qsa-consulta-service";
import { ReceitaWsQsaConsultaAdapter } from "@/modules/cadastro/infrastructure/adapters/receitaws-qsa-consulta.adapter";
import { MockQsaConsultaService } from "@/modules/cadastro/infrastructure/adapters/mock-qsa-consulta.adapter";

// Provedores de consulta de CNPJ/QSA disponíveis. Hoje só ReceitaWS está
// implementado — SERPRO entra aqui como mais um case quando a contratação
// fechar, sem precisar tocar em nenhuma outra camada (use case, controller,
// rota), já que todas dependem só da porta QsaConsultaService.
export type QsaProvider = "receitaws" | "mock";

// Ponto único de troca de provedor — QSA_PROVIDER decide explicitamente;
// sem a env var, cai no comportamento de hoje (ReceitaWS se tiver token
// configurado, senão mock), preservando o deploy atual sem exigir mudança.
export function createQsaConsultaService(): QsaConsultaService {
  const provider =
    (process.env.QSA_PROVIDER as QsaProvider | undefined) ??
    (process.env.RECEITAWS_API_TOKEN ? "receitaws" : "mock");

  switch (provider) {
    case "receitaws":
      return new ReceitaWsQsaConsultaAdapter();
    // case "serpro":
    //   return new SerproQsaConsultaAdapter();
    case "mock":
    default:
      return new MockQsaConsultaService();
  }
}
