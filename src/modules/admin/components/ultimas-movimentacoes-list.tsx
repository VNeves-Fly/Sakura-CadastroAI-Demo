import type { HistoricoEtapaCadastroItem } from "@/modules/cadastro/domain/repositories/agencia-repository";
import { labelStatusAgencia } from "@/modules/cadastro/utils/status-agencia-label.util";
import { formatarTempoRelativo } from "@/modules/shared/utils/tempo-relativo.util";

const COR_ORIGEM_IA = "#8A2BE2";
const COR_ORIGEM_USUARIO = "#008B8B";
const COR_ORIGEM_SISTEMA = "#6B7280";

// `origem` é texto livre (ver ContextoMudancaStatus) — "usuario"/"ia" são
// os dois valores fechados, "sistema - <agente>" tem o agente específico
// (ex.: "sistema - d4sign") depois do hífen, que aqui só interessa pra cor
// (todo "sistema - *" cai no mesmo badge neutro).
function corOrigem(origem: string | null): string {
  if (origem === "ia") return COR_ORIGEM_IA;
  if (origem === "usuario") return COR_ORIGEM_USUARIO;
  return COR_ORIGEM_SISTEMA;
}

function labelOrigem(origem: string | null): string {
  if (origem === "ia") return "IA";
  if (origem === "usuario") return "Analista";
  if (!origem) return "—";
  return origem.startsWith("sistema") ? "Sistema" : origem;
}

interface UltimasMovimentacoesListProps {
  itens: HistoricoEtapaCadastroItem[];
}

// Feed cronológico das últimas transições de etapa (ver
// HistoricoEtapaCadastro/listarUltimasMovimentacoesEtapa) — quem/o que
// causou cada mudança e quando, cruzando todas as agências.
export function UltimasMovimentacoesList({ itens }: UltimasMovimentacoesListProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
        Últimas movimentações
      </h2>
      {itens.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">Nenhuma movimentação ainda.</p>
      ) : (
        <ul className="divide-border mt-3 flex flex-col divide-y">
          {itens.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="flex flex-col">
                <span className="text-foreground font-medium">{item.agenciaNome}</span>
                <span className="text-muted-foreground text-xs">
                  {item.statusAnterior === null
                    ? "Cadastro criado"
                    : `${labelStatusAgencia(item.statusAnterior)} → ${labelStatusAgencia(item.statusNovo)}`}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: corOrigem(item.origem) }}
                >
                  {labelOrigem(item.origem)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatarTempoRelativo(item.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
