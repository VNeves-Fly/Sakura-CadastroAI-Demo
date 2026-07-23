import type { ResumoExecutivo, ResumoGestor } from "@/modules/atribuicoes/types/atribuicao.types";

interface ResumoSelecaoProps {
  executivo: ResumoExecutivo | null;
  gestor: ResumoGestor | null;
}

// Banner de destaque quando um filtro de Executivo/Gestor está ativo —
// responde direto "quantas agências tem meu executivo, qual base é a
// dele" sem precisar procurar na tabela de baixo.
export function ResumoSelecao({ executivo, gestor }: ResumoSelecaoProps) {
  if (!executivo && !gestor) return null;

  return (
    <div className="bg-accent flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl px-5 py-4">
      {executivo ? (
        <>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Executivo
            </p>
            <p className="text-accent-foreground text-sm font-bold">{executivo.executivo}</p>
          </div>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Base
            </p>
            <p className="text-accent-foreground text-sm font-bold">{executivo.base ?? "—"}</p>
          </div>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Gestor
            </p>
            <p className="text-accent-foreground text-sm font-bold">{executivo.gestor ?? "—"}</p>
          </div>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Cidades atendidas
            </p>
            <p className="text-accent-foreground text-sm font-bold">{executivo.totalCidades}</p>
          </div>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Agências (exemplo)
            </p>
            <p className="text-accent-foreground text-sm font-bold">
              {executivo.totalAgenciasMock}
            </p>
          </div>
        </>
      ) : null}

      {gestor ? (
        <>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Gestor
            </p>
            <p className="text-accent-foreground text-sm font-bold">{gestor.gestor}</p>
          </div>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Bases
            </p>
            <p className="text-accent-foreground text-sm font-bold">{gestor.totalBases}</p>
          </div>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Executivos
            </p>
            <p className="text-accent-foreground text-sm font-bold">{gestor.totalExecutivos}</p>
          </div>
          <div>
            <p className="text-accent-foreground/70 text-xs font-medium tracking-wide uppercase">
              Cidades atendidas
            </p>
            <p className="text-accent-foreground text-sm font-bold">{gestor.totalCidades}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
