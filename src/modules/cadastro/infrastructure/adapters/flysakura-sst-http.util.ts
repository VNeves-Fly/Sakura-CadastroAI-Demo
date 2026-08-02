// Base URL/credencial do SST (sst.flysakura.com — Sica/Sigot/TravelLink) —
// domínio e credencial separados de agents.flysakura.com (AMAT/SOFIA/IA),
// mesmo padrão de flysakura-http.util.ts.
export function sstBaseUrl(): string {
  return process.env.SST_BASE_URL ?? "https://sst.flysakura.com";
}

export function requireSstApiKey(): string {
  const apiKey = process.env.SST_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SST_API_KEY não configurada — necessária para integrar com sst.flysakura.com.",
    );
  }
  return apiKey;
}
