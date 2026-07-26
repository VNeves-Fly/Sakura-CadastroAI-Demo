const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Normaliza texto livre pro formato de slug (minúsculo, hífens) em vez de
// rejeitar de cara — mesmo espírito de tolerância de outras normalizações
// do projeto (ex.: normalizarEstadoCivil). Usado tanto pra sugerir um slug
// a partir do nome (client-side) quanto pra validar o que o usuário digitou
// (use-case).
export function normalizarSlug(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugValido(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}
