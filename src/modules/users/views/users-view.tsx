"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useUsuariosListaViewModel } from "@/modules/users/view-models/use-usuarios-lista.view-model";
import { UsuariosKpis } from "@/modules/users/components/usuarios-kpis";
import { UsuariosToolbar } from "@/modules/users/components/usuarios-toolbar";
import { UsuariosTabela } from "@/modules/users/components/usuarios-tabela";
import { UsuariosPaginacao } from "@/modules/users/components/usuarios-paginacao";
import { UsuarioFormModal } from "@/modules/users/components/usuario-form-modal";
import { TAMANHO_PAGINA_USUARIOS } from "@/modules/users/types/user-lista.types";

// Página /cadastros/usuarios (SPEC "Usuários", handoff 2026-08-26) — listagem
// gerenciável substituindo o form-no-topo + lista longa antigos: KPIs, busca,
// filtro por cargo, ordenação, paginação (20/página) e cadastro/edição no
// mesmo modal. Coluna "Status" ficou fora da tabela por pedido do usuário —
// o campo `ativo` continua real (switch no modal, KPIs Ativos/Inativos,
// bloqueia login), só não vira coluna dedicada na grade.
export function UsersView() {
  const {
    users,
    total,
    kpis,
    isLoading,
    error,
    busca,
    atualizarBusca,
    cargoFiltro,
    atualizarCargoFiltro,
    pagina,
    totalPaginas,
    setPagina,
  } = useUsuariosListaViewModel();

  const [modalAberto, setModalAberto] = useState(false);
  const [userEmEdicaoId, setUserEmEdicaoId] = useState<string | null>(null);

  // Um único modal atende Novo e Editar (ver usuario-form-modal.tsx) —
  // onOpenChange(false) zera os dois estados de uma vez, só um fica ativo.
  function fecharModal(aberto: boolean) {
    if (aberto) {
      setModalAberto(true);
      return;
    }
    setModalAberto(false);
    setUserEmEdicaoId(null);
  }

  return (
    <div className="flex w-full max-w-[1180px] flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold tracking-[0.12em] text-[#E91E8C] uppercase">
            Administração
          </p>
          <h1 className="text-[1.9rem] font-extrabold tracking-[-0.02em] text-[#16162A]">
            Usuários
          </h1>
          <p className="text-sm text-[#6B6B85]">
            Gerencie acessos, cargos e status da equipe Sakura.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#E91E8C] px-[1.4rem] py-3 text-sm font-semibold whitespace-nowrap text-white shadow-[0_4px_20px_rgba(233,30,140,0.35)] transition hover:opacity-90 active:scale-[0.96]"
        >
          <Plus className="size-4" />
          Novo usuário
        </button>
      </div>

      <UsuariosKpis
        total={kpis.total}
        ativos={kpis.ativos}
        inativos={kpis.inativos}
        administradores={kpis.administradores}
      />

      <div className="overflow-hidden rounded-[18px] border border-[#E9E9F2] bg-white shadow-[0_1px_2px_rgba(16,16,40,0.04)]">
        <UsuariosToolbar
          busca={busca}
          onBuscaChange={atualizarBusca}
          cargoFiltro={cargoFiltro}
          onCargoFiltroChange={atualizarCargoFiltro}
        />

        <UsuariosTabela
          users={users}
          isLoading={isLoading}
          error={error}
          onEditar={setUserEmEdicaoId}
        />

        {!isLoading && !error ? (
          <UsuariosPaginacao
            pagina={pagina}
            totalPaginas={totalPaginas}
            total={total}
            tamanhoPagina={TAMANHO_PAGINA_USUARIOS}
            onMudarPagina={setPagina}
          />
        ) : null}
      </div>

      <UsuarioFormModal aberto={modalAberto} userId={userEmEdicaoId} onOpenChange={fecharModal} />
    </div>
  );
}
