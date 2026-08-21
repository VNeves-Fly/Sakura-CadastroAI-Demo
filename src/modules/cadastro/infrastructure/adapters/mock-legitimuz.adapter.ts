import type {
  BiometriaVerificacaoService,
  IniciarVerificacaoBiometricaInput,
  IniciarVerificacaoBiometricaResult,
} from "@/modules/cadastro/domain/services/biometria-verificacao-service";

// Simula o get-sdk-url da Legitimuz — usado quando LEGITIMUZ_TOKEN não
// está configurada. Não dispara webhook sozinho: pra simular aprovação em
// dev, chame POST /api/webhooks/legitimuz manualmente com o `refId`
// devolvido aqui como `ref_id` (mesmo espírito do MockD4SignService).
export class MockLegitimuzService implements BiometriaVerificacaoService {
  async iniciarVerificacao(
    input: IniciarVerificacaoBiometricaInput,
  ): Promise<IniciarVerificacaoBiometricaResult> {
    const sessionId = `mock-session-${input.refId}`;
    return {
      url: `https://mock-legitimuz.example.com/w/${sessionId}`,
      urlQrCode: `https://mock-legitimuz.example.com/w/${sessionId}/qr-code`,
      sessionId,
      personId: `mock-person-${input.refId}`,
    };
  }
}
