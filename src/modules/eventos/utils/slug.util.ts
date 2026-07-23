// Remove acento/espaço/pontuação e deixa tudo minúsculo e colado — mesmo
// formato do exemplo de link do produto (ex.: "SUMMIT 2026 SP" -> "summit2026sp").
export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Slug final = evento + executivo colados por hífen (ex.: "summit2026sp-joaosilva"),
// como um link de afiliado — um por executivo dentro do mesmo evento.
export function gerarSlugEventoLink(nomeEvento: string, nomeExecutivo: string): string {
  return `${slugificar(nomeEvento)}-${slugificar(nomeExecutivo)}`;
}
