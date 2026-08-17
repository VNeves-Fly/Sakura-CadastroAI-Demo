import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";

// Nível hierárquico do Gestor — mock 100% front-end (pedido do usuário,
// 2026-08-17): o model Gestor do Prisma não tem campo `nivel` hoje e a
// decisão foi não fazer migration ainda. O valor escolhido no cadastro fica
// só em localStorage (ver gestor-niveis.store.ts); gestores que não
// passaram pelo cadastro novo recebem um nível "seed" determinístico
// (ver gestorListaAdapter) só pra a coluna não nascer vazia.
export type GestorNivel = "gerente" | "coordenador" | "gerente_executivo" | "gerente_regional";

export const NIVEIS_GESTOR: { valor: GestorNivel; label: string }[] = [
  { valor: "gerente", label: "Gerente" },
  { valor: "coordenador", label: "Coordenador" },
  { valor: "gerente_executivo", label: "Gerente Executivo" },
  { valor: "gerente_regional", label: "Gerente Regional" },
];

const LABEL_POR_NIVEL: Record<GestorNivel, string> = Object.fromEntries(
  NIVEIS_GESTOR.map((item) => [item.valor, item.label]),
) as Record<GestorNivel, string>;

export function labelDoNivel(nivel: GestorNivel): string {
  return LABEL_POR_NIVEL[nivel];
}

// Seed determinístico (mesmo hash de promotor-lista.adapter.ts) pra gestores
// que nunca passaram pelo cadastro novo — sem isso a coluna Nível nasceria
// vazia pra toda a base já existente.
export function nivelSeed(id: string): GestorNivel {
  const indice = hashParaNumero(id) % NIVEIS_GESTOR.length;
  return NIVEIS_GESTOR[indice]!.valor;
}
