"use client";

import { useMemo, useState } from "react";
import { useUsersListViewModel } from "@/modules/users/view-models/use-users-list.view-model";
import { TAMANHO_PAGINA_USUARIOS, type CargoFiltro } from "@/modules/users/types/user-lista.types";
import type { UserView } from "@/modules/users/types/user.types";

function nomeCompleto(user: UserView): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

function ordenarPorNome(users: UserView[]): UserView[] {
  return [...users].sort((a, b) => nomeCompleto(a).localeCompare(nomeCompleto(b), "pt-BR"));
}

// Junta busca + filtro de cargo + paginação (20/página, SPEC §2.3) por cima
// da lista completa carregada por useUsersListViewModel — mesmo padrão
// client-side de use-gestores-lista.view-model.ts. Ordenação é sempre A-Z
// por nome, sem controle na UI (pedido do usuário, 2026-08-26 — tirou o
// select "Ordenar" da toolbar, A-Z já é o padrão e único modo). KPIs vêm
// da lista completa (`users`), nunca da filtrada (SPEC §2.2).
export function useUsuariosListaViewModel() {
  const { users, isLoading, error, reload } = useUsersListViewModel();
  const [busca, setBusca] = useState("");
  const [cargoFiltro, setCargoFiltro] = useState<CargoFiltro>("Todos");
  const [pagina, setPagina] = useState(1);

  const kpis = useMemo(
    () => ({
      total: users.length,
      ativos: users.filter((user) => user.ativo).length,
      inativos: users.filter((user) => !user.ativo).length,
      administradores: users.filter((user) => user.cargo === "ADMIN").length,
    }),
    [users],
  );

  const usersFiltrados = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    const porCargo =
      cargoFiltro === "Todos" ? users : users.filter((user) => user.cargo === cargoFiltro);
    const porBusca = buscaNormalizada
      ? porCargo.filter((user) =>
          [nomeCompleto(user), user.email, user.phone]
            .join(" ")
            .toLowerCase()
            .includes(buscaNormalizada),
        )
      : porCargo;

    return ordenarPorNome(porBusca);
  }, [users, busca, cargoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(usersFiltrados.length / TAMANHO_PAGINA_USUARIOS));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const usersDaPagina = usersFiltrados.slice(
    (paginaAtual - 1) * TAMANHO_PAGINA_USUARIOS,
    paginaAtual * TAMANHO_PAGINA_USUARIOS,
  );

  // Buscar ou filtrar volta pra página 1 (SPEC §2.3).
  function atualizarBusca(valor: string) {
    setBusca(valor);
    setPagina(1);
  }

  function atualizarCargoFiltro(valor: CargoFiltro) {
    setCargoFiltro(valor);
    setPagina(1);
  }

  return {
    users: usersDaPagina,
    total: usersFiltrados.length,
    kpis,
    isLoading,
    error,
    reload,
    busca,
    atualizarBusca,
    cargoFiltro,
    atualizarCargoFiltro,
    pagina: paginaAtual,
    totalPaginas,
    setPagina,
  };
}
