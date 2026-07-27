// Base URL/credencial compartilhadas pelos adapters que integram com o
// agente da Sakura (https://agents.flysakura.com) — FlysakuraAnaliseIaAdapter
// (POST /api/v1/agency-analysis/sync) e FlysakuraSofiaConsultaAdapter (GET
// /api/v1/sofia/): mesmo provedor/credencial, endpoints diferentes.
export function flysakuraBaseUrl(): string {
  return process.env.AGENCY_ANALYSIS_BASE_URL ?? "https://agents.flysakura.com";
}

export function requireFlysakuraApiKey(): string {
  const apiKey = process.env.AGENCY_ANALYSIS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AGENCY_ANALYSIS_API_KEY não configurada — necessária para integrar com agents.flysakura.com.",
    );
  }
  return apiKey;
}
