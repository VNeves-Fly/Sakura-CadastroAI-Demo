import type {
  SofiaConsultaResultado,
  SofiaConsultaService,
} from "@/modules/cadastro/domain/services/sofia-consulta-service";
import {
  flysakuraBaseUrl,
  requireFlysakuraApiKey,
} from "@/modules/cadastro/infrastructure/adapters/flysakura-http.util";

// Integração real com o endpoint dedicado de SOFIA do agente da Sakura —
// GET /api/v1/sofia/, separado do POST /api/v1/agency-analysis/sync usado
// por FlysakuraAnaliseIaAdapter (mesmo provedor/credencial, ver
// flysakura-http.util.ts). Existe pra reconsultar só SOFIA (ver
// ReconsultarCreditoUseCase) sem repetir o pipeline de análise completo,
// que é a única forma de trazer SOFIA hoje na análise automática (a
// chamada combinada não expõe um flag "verificar_sofia" isolado).
//
// Contrato confirmado pelo usuário (2026-07-27) via exemplo real:
//   GET /api/v1/sofia/?field=CNPJ&value={cnpjSemMascara}&formatter=cnpj
//   -> { total: number, records: [...] }
// `total: 0` = nada consta; `records` sem schema publicado (dict livre),
// mesma cautela do restante do stage2 (ver SofiaRegistro).
export class FlysakuraSofiaConsultaAdapter implements SofiaConsultaService {
  async consultarPorCnpj(cnpj: string): Promise<SofiaConsultaResultado> {
    const url = new URL("/api/v1/sofia/", flysakuraBaseUrl());
    url.searchParams.set("field", "CNPJ");
    url.searchParams.set("value", cnpj);
    url.searchParams.set("formatter", "cnpj");

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-Internal-Secret": requireFlysakuraApiKey(),
      },
    });

    if (!response.ok) {
      throw new Error(`sofia respondeu ${response.status}: ${await response.text()}`);
    }

    const resultado = (await response.json()) as Partial<SofiaConsultaResultado>;
    return { total: resultado.total ?? 0, records: resultado.records ?? [] };
  }
}
