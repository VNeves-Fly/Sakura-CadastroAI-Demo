import type {
  ContratoAssinaturaService,
  GerarContratoInput,
  GerarContratoResult,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";

// Simula a geração + envio do contrato pra assinatura dos sócios — usado
// quando D4SIGN_TOKEN_API não está configurada. A integração real
// (D4SignAdapter, mesma pasta) já está pronta e ativa no composition root
// quando essa env existir.
export class MockD4SignService implements ContratoAssinaturaService {
  async gerarEEnviar(input: GerarContratoInput): Promise<GerarContratoResult> {
    const provedorId = `mock-d4sign-${input.cnpj}`;
    return { provedorId, status: "aguardando_assinatura" };
  }
}
