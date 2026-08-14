// Hash determinístico (djb2) — o mesmo texto sempre gera o mesmo número,
// em qualquer render/navegação (evita mismatch de hidratação SSR × cliente
// e mantém qualquer dado derivado — mock ou visual — estável no tempo).
// Extraído de promotor-lista.adapter.ts pra ser reaproveitado por outros
// módulos (ex.: gradiente de avatar, métricas mock do detalhe do executivo).
export function hashParaNumero(texto: string): number {
  let hash = 5381;
  for (let indice = 0; indice < texto.length; indice += 1) {
    hash = (hash * 33) ^ texto.charCodeAt(indice);
  }
  return Math.abs(hash);
}
