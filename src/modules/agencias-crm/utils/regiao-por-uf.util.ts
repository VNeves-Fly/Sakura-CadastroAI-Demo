// Mapa UF -> Região geográfica do Brasil — fato geográfico fixo (não é
// mock de negócio), usado pra derivar o filtro "Região" a partir de
// Base.uf (real). Preferido a Base.regiaoIdLegado porque esse campo não é
// exposto em nenhuma camada do domínio hoje (nem entidade nem repositório
// — ver comentário do model no schema.prisma) e estendê-lo só pra esta
// tela tocaria um módulo compartilhado (bases) fora do escopo desta SPEC.
const REGIAO_POR_UF: Record<string, string> = {
  AC: "Norte",
  AP: "Norte",
  AM: "Norte",
  PA: "Norte",
  RO: "Norte",
  RR: "Norte",
  TO: "Norte",
  AL: "Nordeste",
  BA: "Nordeste",
  CE: "Nordeste",
  MA: "Nordeste",
  PB: "Nordeste",
  PE: "Nordeste",
  PI: "Nordeste",
  RN: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste",
  GO: "Centro-Oeste",
  MT: "Centro-Oeste",
  MS: "Centro-Oeste",
  ES: "Sudeste",
  MG: "Sudeste",
  RJ: "Sudeste",
  SP: "Sudeste",
  PR: "Sul",
  RS: "Sul",
  SC: "Sul",
};

export function regiaoPorUf(uf: string | null | undefined): string | null {
  if (!uf) return null;
  return REGIAO_POR_UF[uf.toUpperCase()] ?? null;
}
