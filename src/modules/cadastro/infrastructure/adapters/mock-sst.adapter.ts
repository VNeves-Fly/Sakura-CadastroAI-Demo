import type {
  SicaConsultaResultado,
  SstService,
  SstStatusConexao,
} from "@/modules/cadastro/domain/services/sst-service";

// Usado quando SST_API_KEY não está configurada (dev local sem acesso ao
// SST) — nunca encontra nada, mesmo padrão de MockSofiaConsultaService.
export class MockSstService implements SstService {
  async consultarSicaCNPJ(): Promise<SicaConsultaResultado> {
    return { encontrado: false, registro: null };
  }

  async consultarSicaCodigoEmpresa(): Promise<SicaConsultaResultado> {
    return { encontrado: false, registro: null };
  }

  async verificarConexao(): Promise<SstStatusConexao> {
    throw new Error(
      "SST_API_KEY não configurada — necessária para testar a conexão de verdade com sst.flysakura.com.",
    );
  }
}
