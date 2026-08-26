import { CARGO_LABELS } from "@/modules/users/utils/cargo-options";
import { formatarUltimoAcesso } from "@/modules/users/utils/ultimo-acesso.util";
import type { Cargo } from "@/modules/users/domain/enums";
import type { UserView } from "@/modules/users/types/user.types";

interface UsuariosTabelaProps {
  users: UserView[];
  isLoading: boolean;
  error: string | null;
  onEditar: (userId: string) => void;
}

// Grade idêntica no cabeçalho e nas linhas (SPEC §2.3) — 5 colunas: a SPEC
// original tinha uma 6ª (Status), removida a pedido do usuário 2026-08-26
// (o dado `ativo` continua real, só a coluna dedicada saiu da tabela — ver
// switch "Usuário ativo" no modal e os KPIs Ativos/Inativos).
const GRID_TEMPLATE = "minmax(230px,2.2fr) minmax(190px,1.6fr) 130px 150px 120px";

const CORES_CARGO: Record<Cargo, { fundo: string; texto: string; borda: string }> = {
  ADMIN: { fundo: "rgba(233,30,140,0.10)", texto: "#C2186F", borda: "rgba(233,30,140,0.25)" },
  DIRETOR_ANALISTA: {
    fundo: "rgba(147,51,234,0.08)",
    texto: "#6D28D9",
    borda: "rgba(147,51,234,0.22)",
  },
  ANALISTA: { fundo: "rgba(6,182,212,0.10)", texto: "#0E7490", borda: "rgba(6,182,212,0.28)" },
  GESTOR: { fundo: "rgba(147,51,234,0.10)", texto: "#7E22CE", borda: "rgba(147,51,234,0.25)" },
  EXECUTIVO: { fundo: "rgba(233,30,140,0.07)", texto: "#D6337F", borda: "rgba(233,30,140,0.18)" },
};

function CargoBadge({ cargo }: { cargo: Cargo }) {
  const cores = CORES_CARGO[cargo];
  return (
    <span
      className="inline-flex w-[132px] items-center justify-center rounded-full border px-2 py-1 text-[0.75rem] font-semibold"
      style={{ background: cores.fundo, color: cores.texto, borderColor: cores.borda }}
    >
      {CARGO_LABELS[cargo]}
    </span>
  );
}

export function UsuariosTabela({ users, isLoading, error, onEditar }: UsuariosTabelaProps) {
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 920 }}>
        <div
          className="grid items-center gap-3 border-b border-[rgba(233,30,140,0.12)] bg-[#FAFAFD] px-5 py-3.5"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          <span className="text-[0.72rem] font-semibold tracking-[0.12em] text-[#8A8AA3] uppercase">
            Usuário
          </span>
          <span className="text-center text-[0.72rem] font-semibold tracking-[0.12em] text-[#8A8AA3] uppercase">
            E-mail
          </span>
          <span className="text-center text-[0.72rem] font-semibold tracking-[0.12em] text-[#8A8AA3] uppercase">
            Telefone
          </span>
          <span className="text-center text-[0.72rem] font-semibold tracking-[0.12em] text-[#8A8AA3] uppercase">
            Cargo
          </span>
          <span className="text-right text-[0.72rem] font-semibold tracking-[0.12em] text-[#8A8AA3] uppercase">
            Ações
          </span>
        </div>

        {isLoading ? (
          <p className="px-5 py-10 text-center text-sm text-[#8A8AA3]">Carregando usuários...</p>
        ) : null}

        {!isLoading && error ? (
          <p className="px-5 py-10 text-center text-sm text-[#D6336C]">{error}</p>
        ) : null}

        {!isLoading && !error && users.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-5 py-14 text-center">
            <p className="text-[0.95rem] font-semibold text-[#16162A]">Nenhum usuário encontrado</p>
            <p className="text-[0.85rem] text-[#8A8AA3]">
              Ajuste a busca ou o filtro de cargo para ver mais resultados.
            </p>
          </div>
        ) : null}

        {!isLoading && !error
          ? users.map((user) => (
              <div
                key={user.id}
                className="grid items-center gap-3 border-b border-[rgba(233,30,140,0.10)] bg-white px-5 py-3.5"
                style={{ gridTemplateColumns: GRID_TEMPLATE }}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[0.85rem] font-semibold tracking-[0.04em] text-[#1F1F33] uppercase">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[0.75rem] text-[#9A9AB5]">
                    Último acesso {formatarUltimoAcesso(user.lastLoginAt)}
                  </span>
                </div>

                <span className="truncate text-center text-[0.8125rem] text-[#8A8AA3]">
                  {user.email}
                </span>

                <span className="text-center font-mono text-[0.8125rem] text-[#5A5A75]">
                  {user.phone}
                </span>

                <div className="flex justify-center">
                  <CargoBadge cargo={user.cargo} />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => onEditar(user.id)}
                    className="text-[0.8125rem] font-semibold text-[#E91E8C] transition hover:text-[#C2186F] hover:underline active:scale-[0.96]"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
