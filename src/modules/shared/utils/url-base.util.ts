// Deriva protocolo+host a partir da requisição em vez de um domínio fixo —
// o mesmo app responde em mais de um domínio (ver AUTH_TRUST_HOST no
// Terraform: cadastroai.flysakura.com e painel.sakuraclick.com.br apontam
// pro mesmo Cloud Run). Fallback só entra em jogo se o header vier ausente
// (não deveria acontecer atrás do LB do GCP).
const FALLBACK_URL_BASE = "https://painel.sakuraclick.com.br";

export function obterUrlBase(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return FALLBACK_URL_BASE;

  const proto = headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
