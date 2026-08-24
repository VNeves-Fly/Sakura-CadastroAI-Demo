import type {
  BiometriaVerificacaoService,
  IniciarVerificacaoBiometricaInput,
  IniciarVerificacaoBiometricaResult,
} from "@/modules/cadastro/domain/services/biometria-verificacao-service";

// REST cru, sem SDK (mesma convenção do D4SignAdapter/EmailSender — ver
// docs/legitimuz/). Sem client de teste real ainda — endpoint e formato de
// resposta vêm só da doc que o usuário colou (ClickUp, sem URL pública
// estável), nunca exercidos contra a conta real da Legitimuz.
function baseUrl(): string {
  return process.env.LEGITIMUZ_API_BASE_URL ?? "https://api.legitimuz.com";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não configurada — necessária para LegitimuzAdapter.`);
  }
  return value;
}

export class LegitimuzAdapter implements BiometriaVerificacaoService {
  async iniciarVerificacao(
    input: IniciarVerificacaoBiometricaInput,
  ): Promise<IniciarVerificacaoBiometricaResult> {
    const formData = new FormData();
    formData.append("cpf", input.cpf);
    formData.append("ref_id", input.refId);
    formData.append("redirect_url", input.redirectUrl);
    // kyc-faceindex = "Transactional Liveness" — só liveness + facematch,
    // sem OCR de documento (o KYC completo, default sem esse parâmetro,
    // faria captura de documento de novo — redundante com o que a própria
    // Legitimuz já cobre aqui, decisão do usuário 2026-08-21).
    formData.append("flow", "kyc-faceindex");
    // ⚠️ Não confirmado ao vivo — o painel da Legitimuz (aba "Editar
    // domínio", 2026-08-21) avisa "Certifique-se de que a opção
    // 'enableRedirect' está habilitada" junto do campo "URL de
    // redirecionamento", mas não existe nenhum toggle nessa tela: é um link
    // pra doc externa deles, o que sugere ser um parâmetro passado na
    // integração (aqui, ou só no SDK Web — não usado neste adapter). Mandado
    // como precaução, formato ("1"/"0", como os outros campos booleanos
    // dessa API) especulativo. Se o redirect não disparar de volta pra
    // /cadastro/biometria/[token] no teste ao vivo, o "URL de
    // redirecionamento" padrão configurado no domínio (mesmo valor com
    // {token}) é o fallback.
    formData.append("enableRedirect", "1");

    const response = await fetch(`${baseUrl()}/public/kyc/get-sdk-url`, {
      method: "POST",
      headers: {
        Origin: requireEnv("LEGITIMUZ_ORIGIN"),
        "x-api-key": requireEnv("LEGITIMUZ_TOKEN"),
      },
      body: formData,
    });

    const resultado = await response.json().catch(() => null);
    if (!response.ok || !resultado) {
      throw new Error(
        `Legitimuz get-sdk-url respondeu ${response.status}: ${JSON.stringify(resultado)}`,
      );
    }

    const dados = resultado as {
      url?: unknown;
      url_qr_code?: unknown;
      session_id?: unknown;
      personId?: unknown;
    };
    if (typeof dados.url !== "string" || typeof dados.session_id !== "string") {
      throw new Error(
        `Legitimuz get-sdk-url retornou um formato inesperado: ${JSON.stringify(dados)}`,
      );
    }

    return {
      url: dados.url,
      urlQrCode: typeof dados.url_qr_code === "string" ? dados.url_qr_code : dados.url,
      sessionId: dados.session_id,
      personId: String(dados.personId ?? ""),
    };
  }
}
