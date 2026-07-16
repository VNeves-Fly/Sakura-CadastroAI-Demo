import type {
  ContratoAssinaturaService,
  GerarContratoInput,
  GerarContratoResult,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";

// Sem integração real com o D4Sign (sem credencial/API disponível neste
// projeto ainda). Simula a geração + envio do contrato pra assinatura dos
// sócios, até a integração real ser conectada nesta mesma porta
// (ContratoAssinaturaService) — trocar a implementação aqui não afeta
// use-case/domain.
export class MockD4SignService implements ContratoAssinaturaService {
  async gerarEEnviar(input: GerarContratoInput): Promise<GerarContratoResult> {
    const provedorId = `mock-d4sign-${input.cnpj}`;
    return { provedorId, status: "aguardando_assinatura" };
  }
}
