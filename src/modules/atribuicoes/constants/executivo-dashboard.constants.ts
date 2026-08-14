// Cores dos gráficos do dashboard do executivo — mesmos tokens globais de
// --chart-1..4 (globals.css), já calibrados pra bater com a paleta da
// SPEC (Aéreo Nacional = rosa, Aéreo Internacional = azul, Terrestre =
// verde/teal, alerta = âmbar). Mesmo padrão de string `hsl(var(--x))`
// usado em dashboard-vendas (ver COR_ROSA/COR_AZUL em
// dashboard-vendas.constants.ts).
export const COR_AEREO_NACIONAL = "hsl(var(--chart-1))";
export const COR_AEREO_INTERNACIONAL = "hsl(var(--chart-2))";
export const COR_TERRESTRE = "hsl(var(--chart-3))";
export const COR_ALERTA = "hsl(var(--chart-4))";
