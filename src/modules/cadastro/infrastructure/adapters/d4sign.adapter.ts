import type {
  ContratoAssinaturaService,
  GerarContratoInput,
  GerarContratoResult,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

// Integração real com o D4Sign (https://docapi.d4sign.com.br/). Fluxo:
// 1. Gera o documento a partir do template Word (variáveis substituídas).
// 2. Registra a URL de webhook nesse documento (se D4SIGN_WEBHOOK_URL
//    existir — sem URL pública configurada, pula esse passo e o avanço
//    de status depois da assinatura fica manual, como já é hoje).
// 3. Cadastra os signatários em estágios (sócios + os fixos da Sakura).
// 4. Envia o documento pra fase "Aguardando Assinaturas", respeitando a
//    ordem dos estágios.
//
// Autenticação é via query string (tokenAPI + cryptKey), não header —
// assim que o D4Sign exige (confirmado no OpenAPI oficial deles).
// Lida a cada chamada (não como const de módulo) pra não travar o valor
// no primeiro import — importa pra troca de ambiente em teste, e é grátis
// em produção já que a env não muda durante o processo rodando.
function baseUrl(): string {
  return process.env.D4SIGN_API_BASE_URL ?? "https://secure.d4sign.com.br/api/v1";
}

// Estágio 0 é sempre os sócios da agência (dinâmico, por cadastro) — os
// signatários fixos da Sakura ocupam os estágios seguintes, conforme o
// campo `estagio` de cada um em SignatarioPadrao.
const ESTAGIO_SOCIOS = 0;

// Espelha 1:1 o campo `act` da API do D4Sign (ver enum PapelSignatarioPadrao
// no schema) — traduz o papel do signatário fixo pro código numérico que a
// API espera.
const ACT_POR_PAPEL: Record<PapelSignatarioPadrao, string> = {
  ASSINAR: "1",
  APROVAR: "2",
  RECONHECER: "3",
  ASSINAR_COMO_PARTE: "4",
  ASSINAR_COMO_TESTEMUNHA: "5",
  ASSINAR_COMO_INTERVENIENTE: "6",
  ACUSAR_RECEBIMENTO: "7",
  ASSINAR_COMO_EMISSOR_ENDOSSANTE_AVALISTA: "8",
  ASSINAR_COMO_EMISSOR_ENDOSSANTE_AVALISTA_FIADOR: "9",
  ASSINAR_COMO_FIADOR: "10",
  ASSINAR_COMO_PARTE_E_FIADOR: "11",
  ASSINAR_COMO_RESPONSAVEL_SOLIDARIO: "12",
  ASSINAR_COMO_PARTE_E_RESPONSAVEL_SOLIDARIO: "13",
};

export class D4SignAdapter implements ContratoAssinaturaService {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

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
    const signatariosPadrao = await this.signatarioPadraoRepository.findAtivos();

    const socios = signatarios.map((socio) => ({
      email: socio.email,
      act: "1", // 1 = assinar
      foreign: "0", // signatário brasileiro
      certificadoicpbr: "0", // sem certificado ICP-Brasil
      assinatura_presencial: "0", // assinatura remota
      after_position: String(ESTAGIO_SOCIOS),
    }));

    const fixos = signatariosPadrao
      .filter((padrao) => padrao.email)
      .map((padrao) => ({
        email: padrao.email as string,
        act: ACT_POR_PAPEL[padrao.papel],
        foreign: "0",
        certificadoicpbr: "0",
        assinatura_presencial: "0",
        after_position: String(padrao.estagio),
      }));

    await this.request("POST", `/documents/${documentUuid}/createlist`, {
      signers: [...socios, ...fixos],
    });
  }

  private async enviarParaAssinatura(documentUuid: string): Promise<void> {
    await this.request("POST", `/documents/${documentUuid}/sendtosigner`, {
      skip_email: "0", // envia e-mail de notificação
      workflow: "1", // respeita a ordem de after_position (estágios)
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
