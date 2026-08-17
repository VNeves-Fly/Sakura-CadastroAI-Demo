import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";

// Gradiente rosa/magenta único por id (SPEC de Executivos, seção 3.2:
// "cor única por executivo, gerada a partir do nome/id") — varia matiz e
// luminosidade dentro da família da marca (base ~323° = --primary), nunca
// sai pra uma cor fora do universo Sakura.
export function gerarGradienteAvatar(seed: string): string {
  const base = hashParaNumero(seed);
  const matiz = 300 + (base % 40); // 300–340: magenta ao rosa
  const inicio = `hsl(${matiz}, 85%, ${45 + (base % 10)}%)`;
  const fim = `hsl(${(matiz + 20) % 360}, 90%, ${60 + (base % 8)}%)`;
  return `linear-gradient(135deg, ${inicio}, ${fim})`;
}

export function extrairIniciais(nome: string): string {
  return (
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "—"
  );
}
