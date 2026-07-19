import type { Cargo } from "@/modules/users/domain/enums";

export const CARGO_OPTIONS: Array<{ value: Cargo; label: string }> = [
  { value: "ADMIN", label: "Admin" },
  { value: "DIRETOR_ANALISTA", label: "Diretor Analista" },
  { value: "ANALISTA", label: "Analista" },
  { value: "GESTOR", label: "Gestor" },
  { value: "EXECUTIVO", label: "Executivo" },
];

export const CARGO_LABELS: Record<Cargo, string> = CARGO_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<Cargo, string>,
);

export const DEFAULT_CARGO: Cargo = "ANALISTA";
