import type {
  ContratoAssinaturaService,
  GerarContratoInput,
  GerarContratoResult,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";

// Integração real com o D4Sign (https://docapi.d4sign.com.br/). Fluxo:
// 1. Gera o documento a partir do template Word (variáveis substituídas).
// 2. Registra a URL de webhook nesse documento (se D4SIGN_WEBHOOK_URL
//    existir — sem URL pública configurada, pula esse passo e o avanço
//    de status depois da assinatura fica manual, como já é hoje).
// 3. Cadastra os sócios como signatários.
// 4. Envia o documento pra fase "Aguardando Assinaturas".
//
// Autenticação é via query string (tokenAPI + cryptKey), não header —
// assim que o D4Sign exige (confirmado no OpenAPI oficial deles).
// Lida a cada chamada (não como const de módulo) pra não travar o valor
// no primeiro import — importa pra troca de ambiente em teste, e é grátis
// em produção já que a env não muda durante o processo rodando.
function baseUrl(): string {
  return process.env.D4SIGN_API_BASE_URL ?? "https://secure.d4sign.com.br/api/v1";
}

export class D4SignAdapter implements ContratoAssinaturaService {
  async gerarEEnviar(input: GerarContratoInput): Promise<GerarContratoResult> {
    const templateId = requireEnv("D4SIGN_TEMPLATE_ID");
    const safeUuid = requireEnv("D4SIGN_SAFE_UUID");

    const documentUuid = await this.criarDocumento(safeUuid, templateId, input);

    const webhookUrl = process.env.D4SIGN_WEBHOOK_URL;
    if (webhookUrl) {
      await this.registrarWebhook(documentUuid, webhookUrl);
    }

    await this.cadastrarSignatarios(documentUuid, input.signatarios);
    await this.enviarParaAssinatura(documentUuid);

    return { provedorId: documentUuid, status: "aguardando_assinatura" };
  }

  private async criarDocumento(
    safeUuid: string,
    templateId: string,
    input: GerarContratoInput,
  ): Promise<string> {
    // Nomes dos tokens conferidos ao vivo (POST /templates) pro template
    // MjE5OTI0 ("Contrato Sakura - Geral.docx") — específicos desse
    // template, não genéricos da API.
    const socios = input.signatarios.map((socio) => `${socio.nome} (CPF: ${socio.cpf})`).join("; ");

    const response = await this.request(
      "POST",
      `/documents/${safeUuid}/makedocumentbytemplateword`,
      {
        name_document: `Contrato Sakura - ${input.razaoSocial}`,
        templates: {
          [templateId]: {
            razaosocial: input.razaoSocial,
            cnpj: input.cnpj,
            cidade: input.endereco.cidade,
            estado: input.endereco.uf,
            endereco: input.endereco.logradouro,
            n: input.endereco.numero,
            complemento: input.endereco.complemento,
            bairro: input.endereco.bairro,
            cep: input.endereco.cep,
            indicacao: input.origem ?? "",
            socios,
          },
        },
      },
    );

    const { uuid } = response as { uuid: string };
    return uuid;
  }

  private async registrarWebhook(documentUuid: string, url: string): Promise<void> {
    await this.request("POST", `/documents/${documentUuid}/webhooks`, { url });
  }

  private async cadastrarSignatarios(
    documentUuid: string,
    signatarios: GerarContratoInput["signatarios"],
  ): Promise<void> {
    await this.request("POST", `/documents/${documentUuid}/createlist`, {
      signers: signatarios.map((socio) => ({
        email: socio.email,
        act: "1", // 1 = assinar
        foreign: "0", // signatário brasileiro
        certificadoicpbr: "0", // sem certificado ICP-Brasil
        assinatura_presencial: "0", // assinatura remota
      })),
    });
  }

  private async enviarParaAssinatura(documentUuid: string): Promise<void> {
    await this.request("POST", `/documents/${documentUuid}/sendtosigner`, {
      skip_email: "0", // envia e-mail de notificação
      workflow: "0", // dispara pra todos os signatários ao mesmo tempo
    });
  }

  private async request(method: string, path: string, body: unknown): Promise<unknown> {
    const url = `${baseUrl()}${path}?tokenAPI=${requireEnv("D4SIGN_TOKEN_API")}&cryptKey=${requireEnv("D4SIGN_CRYPT_KEY")}`;
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const resultado = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`D4Sign ${path} respondeu ${response.status}: ${JSON.stringify(resultado)}`);
    }
    return resultado;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não configurada — necessária para D4SignAdapter.`);
  }
  return value;
}
