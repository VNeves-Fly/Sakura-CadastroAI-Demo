export interface IniciarVerificacaoBiometricaInput {
  cpf: string;
  // Mesmo valor usado como token de acesso na página pública
  // (/cadastro/biometria/[token]) — reaproveitado como `ref_id` na chamada
  // da Legitimuz pra correlacionar o webhook de volta a essa verificação.
  refId: string;
  redirectUrl: string;
}

export interface IniciarVerificacaoBiometricaResult {
  url: string;
  urlQrCode: string;
  sessionId: string;
  personId: string;
}

export interface BiometriaVerificacaoService {
  // POST /public/kyc/get-sdk-url (flow=kyc-faceindex — "Transactional
  // Liveness", só liveness+facematch, sem OCR de documento). Resultado da
  // verificação em si é assíncrono, chega só pelo webhook da Legitimuz.
  iniciarVerificacao(
    input: IniciarVerificacaoBiometricaInput,
  ): Promise<IniciarVerificacaoBiometricaResult>;
}
