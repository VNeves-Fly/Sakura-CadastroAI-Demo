// Paleta desta página — vem de custom properties CSS escopadas à classe
// `.dashboard-vendas-scope` (ver src/app/globals.css, mesmo padrão do
// `.chat-scope` já existente ali) em vez de hex cru, pra poder ser
// reaproveitada em CSS sem duplicar valor — mas isolada em variáveis
// próprias (`--dv-*`), nunca em `:root`, então nada fora desta página é
// afetado. Não é 1 cor por categoria fixa: a própria spec usa combinações
// diferentes por gráfico (ex.: "Internacional" é roxo no intraday mas
// rosa na projeção) — cada componente decide qual destas usar pra bater
// com o texto da seção.
// As custom properties guardam só o tripleto HSL (`323 93% 51%`, mesmo
// formato de --primary/--chart-1 em globals.css) — sem o `hsl(...)`
// embutido, senão não dava pra aplicar opacidade/outras composições CSS
// depois. Por isso todo consumo aqui envolve em `hsl(var(--dv-x))`.
export const COR_ROSA = "hsl(var(--dv-rosa))";
export const COR_AZUL = "hsl(var(--dv-azul))";
export const COR_ROXO = "hsl(var(--dv-roxo))";
export const COR_VERDE = "hsl(var(--dv-verde))";
export const COR_AMARELO = "hsl(var(--dv-amarelo))";
export const COR_CINZA = "hsl(var(--dv-cinza))";
export const COR_SUCESSO = "hsl(var(--dv-sucesso))";
export const COR_PERIGO = "hsl(var(--dv-perigo))";

export const COR_ROSA_BG = "hsl(var(--dv-rosa-bg))";
export const COR_AZUL_BG = "hsl(var(--dv-azul-bg))";
