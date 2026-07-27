import type {
  ArquivoContrato,
  ContratoAssinaturaService,
  DocumentoD4SignInfo,
  GerarContratoInput,
  GerarContratoResult,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import {
  formatarClausulaSocio,
  formatarIndicacaoRepresentantes,
} from "@/modules/cadastro/domain/services/clausula-contrato.formatter";

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

    await this.registrarWebhook(documentUuid);

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
    const socios = input.signatarios.map(formatarClausulaSocio).join(" e ");
    const indicacao = formatarIndicacaoRepresentantes(input.signatarios.length);

    const response = await this.request(
      "POST",
      `/documents/${safeUuid}/makedocumentbytemplateword`,
      {
        // CNPJ no final do nome do documento (sem máscara) — antes o SICA
        // faria esse papel de identificador único, mas ele só é coletado
        // depois do contrato assinado (etapa de Validação), tarde demais
        // pra nomear o documento na hora da geração.
        name_document: `Contrato Sakura - ${input.razaoSocial} - ${input.cnpj}`,
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
            indicacao,
            socios,
          },
        },
      },
    );

    const { uuid } = response as { uuid: string };
    return uuid;
  }

  async registrarWebhook(provedorId: string): Promise<{ registrado: boolean }> {
    const url = process.env.D4SIGN_WEBHOOK_URL;
    if (!url) {
      return { registrado: false };
    }

    await this.request("POST", `/documents/${provedorId}/webhooks`, { url });
    return { registrado: true };
  }

  // `/download` não devolve os bytes do PDF direto — devolve um JSON com
  // um link temporário pro arquivo real (confirmado no SDK oficial:
  // `getfileurl()` retorna um objeto e o exemplo do README busca o PDF
  // com `file_get_contents($url_final->url)`). Por isso precisa dos dois
  // fetches: um pro link assinado, outro pro arquivo em si. `encoding:
  // false` pede o PDF cru (não base64) — confirmado na doc oficial
  // (`docapi.d4sign.com.br/reference/download-de-um-documento`).
  async visualizarDocumento(provedorId: string): Promise<ArquivoContrato> {
    const url = `${baseUrl()}/documents/${provedorId}/download?tokenAPI=${requireEnv("D4SIGN_TOKEN_API")}&cryptKey=${requireEnv("D4SIGN_CRYPT_KEY")}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pdf", language: "pt", encoding: false }),
    });

    if (!response.ok) {
      throw new Error(`D4Sign /documents/${provedorId}/download respondeu ${response.status}`);
    }

    const { url: signedUrl } = (await response.json()) as { url: string };
    const arquivo = await fetch(signedUrl);
    if (!arquivo.ok) {
      throw new Error(`D4Sign download (signed-URL) respondeu ${arquivo.status}`);
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    return { buffer, mimeType: "application/pdf" };
  }

  // ⚠️ Formato de resposta não documentado publicamente pelo D4Sign — só
  // GET /documents/{uuid} sem sufixo foi testado ao vivo neste projeto
  // antes (docs/d4sign.md §3, retorna array com uuidDoc/nameDoc/
  // statusName). Array vazio ou erro de rede/HTTP são tratados como
  // "não existe" — pro caller (RegistrarContratoExternoUseCase) as duas
  // situações pedem a mesma resposta ao analista.
  async obterDocumento(provedorId: string): Promise<DocumentoD4SignInfo> {
    try {
      const resultado = (await this.request("GET", `/documents/${provedorId}`, undefined)) as
        | Array<{ uuidDoc?: string; nameDoc?: string; statusName?: string }>
        | { uuidDoc?: string; nameDoc?: string; statusName?: string };

      const documento = Array.isArray(resultado) ? resultado[0] : resultado;
      if (!documento?.uuidDoc) {
        return { existe: false, nomeDocumento: null, statusName: null };
      }

      return {
        existe: true,
        nomeDocumento: documento.nameDoc ?? null,
        statusName: documento.statusName ?? null,
      };
    } catch {
      return { existe: false, nomeDocumento: null, statusName: null };
    }
  }

  // ⚠️ Formato de resposta não documentado publicamente pelo D4Sign —
  // não testado ao vivo ainda (ver docs/d4sign.md). Assume uma lista de
  // objetos com campo `email`, tolerando variação no nome dos demais
  // campos (não usados aqui).
  async obterDestinatarios(provedorId: string): Promise<string[]> {
    const resultado = (await this.request("GET", `/documents/${provedorId}/list`, undefined)) as
      Array<{ email?: string }> | { list?: Array<{ email?: string }> };

    const lista = Array.isArray(resultado) ? resultado : (resultado.list ?? []);
    return lista.map((item) => item.email).filter((email): email is string => Boolean(email));
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
      docauthandselfie: "1", // exige selfie com documento
      videoselfie: "1", // exige vídeo selfie
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
