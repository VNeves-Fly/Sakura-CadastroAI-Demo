// Domínio de exemplo dado pelo usuário (cadastroai.flysakura.com/{slug}) —
// vira configurável quando o back-end/DNS real existir.
export const DOMINIO_CADASTRO = "cadastroai.flysakura.com";

export function montarUrlEventoLink(slug: string): string {
  return `https://${DOMINIO_CADASTRO}/${slug}`;
}
