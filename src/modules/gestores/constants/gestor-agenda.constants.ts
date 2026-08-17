// Paleta cíclica pra distinguir cada executivo na agenda consolidada do
// gestor (chips + eventos do calendário) — cores semânticas já existentes
// no projeto (mesmos tokens usados em badges/status por toda a app), só
// reaproveitadas em ordem fixa. 5 cores é o bastante pra distinguir
// visualmente sem virar sopa de letrinhas; executivos repetem a cor ciclando.
export interface CorExecutivo {
  bg: string;
  text: string;
  dot: string;
}

const PALETA_EXECUTIVOS: CorExecutivo[] = [
  { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  { bg: "bg-secondary/10", text: "text-secondary", dot: "bg-secondary" },
];

export function corDoExecutivo(indice: number): CorExecutivo {
  return PALETA_EXECUTIVOS[indice % PALETA_EXECUTIVOS.length]!;
}
