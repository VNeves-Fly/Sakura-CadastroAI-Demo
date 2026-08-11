import type {
  ArquivoContrato,
  ContratoAssinaturaService,
  DestinatarioD4Sign,
  DocumentoD4SignInfo,
  GerarContratoInput,
  GerarContratoResult,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";

// PDF válido mínimo (1 página em branco), hardcoded — só pra o botão
// "Visualizar Documento" ter algo real pra renderizar em dev sem
// credenciais do D4Sign.
const PDF_PLACEHOLDER = Buffer.from(
  "JVBERi0xLjEKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDQgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjE5MAolJUVPRg==",
  "base64",
);

// Simula a geração + envio do contrato pra assinatura dos sócios — usado
// quando D4SIGN_TOKEN_API não está configurada. A integração real
// (D4SignAdapter, mesma pasta) já está pronta e ativa no composition root
// quando essa env existir.
export class MockD4SignService implements ContratoAssinaturaService {
  async gerarEEnviar(input: GerarContratoInput): Promise<GerarContratoResult> {
    const provedorId = `mock-d4sign-${input.cnpj}`;
    return {
      provedorId,
      status: "aguardando_assinatura",
      // Só os sócios (input.signatarios) — o mock não conhece os
      // signatários fixos da Sakura (cadastrados só dentro do
      // D4SignAdapter real, via SignatarioPadraoRepository).
      signatariosKeySigner: input.signatarios.map((signatario) => ({
        email: signatario.email,
        keySigner: Buffer.from(`mock-key-signer-${signatario.email}`).toString("base64"),
      })),
    };
  }

  async visualizarDocumento(): Promise<ArquivoContrato> {
    return { buffer: PDF_PLACEHOLDER, mimeType: "application/pdf" };
  }

  async obterDocumento(provedorId: string): Promise<DocumentoD4SignInfo> {
    return {
      existe: true,
      nomeDocumento: `Documento mock (${provedorId})`,
      statusName: "Aguardando Assinaturas",
    };
  }

  async obterDestinatarios(): Promise<DestinatarioD4Sign[]> {
    return [];
  }

  async registrarWebhook(): Promise<{ registrado: boolean }> {
    return { registrado: true };
  }

  async cancelarDocumento(): Promise<void> {
    return;
  }

  async obterLinkAssinatura(provedorId: string): Promise<string> {
    return `https://mock-d4sign.example.com/w/i/${provedorId}/link-de-assinatura`;
  }
}
