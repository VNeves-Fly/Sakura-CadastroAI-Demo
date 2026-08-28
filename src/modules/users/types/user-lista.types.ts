import type { Cargo } from "@/modules/users/domain/enums";

export type CargoFiltro = "Todos" | Cargo;

export const TAMANHO_PAGINA_USUARIOS = 20;

export const CHIPS_CARGO: Array<{ valor: CargoFiltro; label: string }> = [
  { valor: "Todos", label: "Todos" },
  { valor: "ADMIN", label: "Admin" },
  { valor: "DIRETOR_ANALISTA", label: "Diretor Analista" },
  { valor: "ANALISTA", label: "Analista" },
  { valor: "GESTOR", label: "Gestor" },
  { valor: "EXECUTIVO", label: "Executivo" },
];
