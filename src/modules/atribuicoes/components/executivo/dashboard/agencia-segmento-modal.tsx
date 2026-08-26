"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { AgenciaSegmentoResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";

const TAMANHO_PAGINA = 10;

interface AgenciaSegmentoModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  agencias: AgenciaSegmentoResumo[];
}

// Modal padrão "ver lista" (SPEC 4.7/4.8 — cards clicáveis de
// cross-canal e saúde da carteira), mesmo espírito do
// AgenciasDetalheModal de dashboard-vendas (busca + tabela + paginação),
// reconstruído aqui porque módulos não compartilham componente de UI
// entre si (ver princípio de isolamento, mesma razão de
// formatar-moeda.util.ts ser duplicado).
export function AgenciaSegmentoModal({
  aberto,
  onOpenChange,
  titulo,
  agencias,
}: AgenciaSegmentoModalProps) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return agencias;
    return agencias.filter(
      (agencia) => agencia.nome.toLowerCase().includes(termo) || agencia.cnpj.includes(termo),
    );
  }, [agencias, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / TAMANHO_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const itensPagina = filtradas.slice(
    (paginaAtual - 1) * TAMANHO_PAGINA,
    paginaAtual * TAMANHO_PAGINA,
  );

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        onOpenChange(valor);
        if (!valor) {
          setBusca("");
          setPagina(1);
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex-row items-baseline gap-2 space-y-0">
          <DialogTitle>{titulo}</DialogTitle>
          <span className="text-muted-foreground text-sm">{filtradas.length} agência(s)</span>
        </DialogHeader>

        <div className="p-4 pb-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(evento) => {
                setBusca(evento.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nome ou CNPJ..."
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="text-muted-foreground px-2 py-2.5 text-xs font-semibold tracking-wide uppercase">
                  Agência
                </th>
                <th className="text-muted-foreground px-2 py-2.5 text-right text-xs font-semibold tracking-wide uppercase">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {itensPagina.map((agencia) => (
                <tr key={agencia.cnpj} className="border-border border-b last:border-0">
                  <td className="px-2 py-2.5">
                    <p className="text-foreground font-medium">{agencia.nome}</p>
                    <p className="text-muted-foreground font-mono text-xs">{agencia.cnpj}</p>
                  </td>
                  <td className="text-foreground px-2 py-2.5 text-right font-semibold">
                    {formatarMoedaAbreviada(agencia.valor)}
                  </td>
                </tr>
              ))}
              {itensPagina.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-muted-foreground py-10 text-center text-sm">
                    Nenhuma agência encontrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {filtradas.length > TAMANHO_PAGINA ? (
          <div className="border-border flex items-center justify-between gap-3 border-t p-4">
            <p className="text-muted-foreground text-xs">
              Página {paginaAtual} de {totalPaginas}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={paginaAtual === 1}
                onClick={() => setPagina((atual) => atual - 1)}
                className="border-input text-foreground flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
                Anterior
              </button>
              <button
                type="button"
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPagina((atual) => atual + 1)}
                className="border-input text-foreground flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próximo
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
