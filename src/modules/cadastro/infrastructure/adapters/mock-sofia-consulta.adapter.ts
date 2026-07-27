import type {
  SofiaConsultaResultado,
  SofiaConsultaService,
} from "@/modules/cadastro/domain/services/sofia-consulta-service";

// Sem integração real com SOFIA. Sempre devolve "nada consta" — só pra a
// reconsulta manual (ver ConsultaSofiaCard) funcionar ponta a ponta quando
// AGENCY_ANALYSIS_API_KEY não está configurada. A integração real
// (FlysakuraSofiaConsultaAdapter, mesma pasta) já está pronta e ativa no
// composition root quando a credencial existir.
export class MockSofiaConsultaService implements SofiaConsultaService {
  async consultarPorCnpj(): Promise<SofiaConsultaResultado> {
    return { total: 0, records: [] };
  }
}
