"use client";

import { useMemo, useState } from "react";
import { Bus, ChevronLeft, ChevronRight, Plane, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  formatarMoedaAbreviada,
  formatarNumero,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_AZUL,
  COR_ROSA,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type {
  AgenciaRecenciaDetalhe,
  Canal,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Mesmo tamanho de página do modal de referência ("Página 1 de 96" pra
// 2.376 registros — só fecha exato com 25/página).
const TAMANHO_PAGINA = 25;

type FiltroCanal = "todos" | Canal;

const OPCOES_CANAL: { valor: FiltroCanal; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "aereo", label: "Aéreo" },
  { valor: "terrestre", label: "Terrestre" },
  { valor: "ambos", label: "Ambos" },
];

const LABEL_CANAL: Record<Canal, string> = {
  aereo: "Só aéreo",
  terrestre: "Só terrestre",
  ambos: "Ambos",
};

const COLUNAS = [
  "Agência",
  "Filial",
  "Executivo",
  "Gestor",
  "Canal",
  "Última venda",
  "Dias",
  "Aéreo 365D",
  "Terrestre 365D",
];

function IconeCanal({ canal }: { canal: Canal }) {
  if (canal === "terrestre")
    return <Bus className="size-3.5 shrink-0" style={{ color: COR_AZUL }} />;
  return <Plane className="size-3.5 shrink-0" style={{ color: COR_ROSA }} />;
}

interface AgenciasDetalheModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  itens: AgenciaRecenciaDetalhe[];
}

// Modal de detalhamento dos 4 cards de recência (4.6) — layout replicado
// estritamente do print de referência (busca + chips de canal com
// contagem + tabela + paginação "Página X de Y"). `dashboard-vendas-scope`
// reaplicado aqui porque o Dialog é portalado pro <body> (fora da árvore
// DOM onde a classe já está no view raiz) — sem isso, COR_ROSA/COR_AZUL
// (var(--dv-*)) não resolvem dentro do modal.
export function AgenciasDetalheModal({
  aberto,
  onOpenChange,
  titulo,
  itens,
}: AgenciasDetalheModalProps) {
  const [busca, setBusca] = useState("");
  const [canal, setCanal] = useState<FiltroCanal>("todos");
  const [pagina, setPagina] = useState(1);

  const itensBuscados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((item) =>
      [item.nome, item.cnpj, item.filial, item.executivo].some((campo) =>
        campo.toLowerCase().includes(termo),
      ),
    );
  }, [itens, busca]);

  const contagemPorCanal = useMemo(
    () => ({
      todos: itensBuscados.length,
      aereo: itensBuscados.filter((item) => item.canal === "aereo").length,
      terrestre: itensBuscados.filter((item) => item.canal === "terrestre").length,
      ambos: itensBuscados.filter((item) => item.canal === "ambos").length,
    }),
    [itensBuscados],
  );

  const itensFiltrados = useMemo(
    () =>
      canal === "todos" ? itensBuscados : itensBuscados.filter((item) => item.canal === canal),
    [itensBuscados, canal],
  );

  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / TAMANHO_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const itensPagina = itensFiltrados.slice(
    (paginaAtual - 1) * TAMANHO_PAGINA,
    paginaAtual * TAMANHO_PAGINA,
  );

  function atualizarBusca(valor: string) {
    setBusca(valor);
    setPagina(1);
  }

  function atualizarCanal(valor: FiltroCanal) {
    setCanal(valor);
    setPagina(1);
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        onOpenChange(valor);
        if (!valor) {
          setBusca("");
          setCanal("todos");
          setPagina(1);
        }
      }}
    >
      <DialogContent className="dashboard-vendas-scope max-w-5xl">
        <DialogHeader className="flex-row items-baseline gap-2 space-y-0">
          <DialogTitle>{titulo}</DialogTitle>
          <span className="text-muted-foreground text-sm">
            {formatarNumero(itensFiltrados.length)} agência(s)
          </span>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 p-4 pb-3">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(evento) => atualizarBusca(evento.target.value)}
              placeholder="Pesquisar por nome, CNPJ, filial, executivo..."
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2"
            />
          </div>
          <div className="bg-muted flex shrink-0 items-center gap-1 rounded-full p-1 text-xs font-semibold">
            {OPCOES_CANAL.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => atualizarCanal(opcao.valor)}
                className={cn(
                  "rounded-full px-3 py-1.5 whitespace-nowrap transition",
                  canal === opcao.valor
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opcao.label} {formatarNumero(contagemPorCanal[opcao.valor])}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                {COLUNAS.map((coluna) => (
                  <th
                    key={coluna}
                    className={cn(
                      "text-muted-foreground px-2 py-2.5 text-xs font-semibold tracking-wide uppercase",
                      ["Dias", "Aéreo 365D", "Terrestre 365D"].includes(coluna) && "text-right",
                    )}
                  >
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itensPagina.map((item) => (
                <tr key={item.cnpj} className="border-border border-b last:border-0">
                  <td className="px-2 py-2.5">
                    <p className="text-foreground font-semibold">{item.nome}</p>
                    <p className="text-muted-foreground text-xs">{item.cnpj}</p>
                  </td>
                  <td className="text-muted-foreground px-2 py-2.5 whitespace-nowrap">
                    {item.filial}
                  </td>
                  <td className="text-muted-foreground px-2 py-2.5 whitespace-nowrap">
                    {item.executivo}
                  </td>
                  <td className="text-muted-foreground px-2 py-2.5 whitespace-nowrap">
                    {item.gestor}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="text-foreground flex items-center gap-1.5 font-semibold whitespace-nowrap">
                      <IconeCanal canal={item.canal} />
                      {LABEL_CANAL[item.canal]}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-2 py-2.5 whitespace-nowrap">
                    {item.ultimaVenda}
                  </td>
                  <td className="text-foreground px-2 py-2.5 text-right">{item.dias}</td>
                  <td className="text-foreground px-2 py-2.5 text-right font-semibold whitespace-nowrap">
                    {formatarMoedaAbreviada(item.aereo365d)}
                  </td>
                  <td className="text-foreground px-2 py-2.5 text-right font-semibold whitespace-nowrap">
                    {formatarMoedaAbreviada(item.terrestre365d)}
                  </td>
                </tr>
              ))}
              {itensPagina.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUNAS.length}
                    className="text-muted-foreground py-12 text-center text-sm"
                  >
                    Nenhuma agência encontrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t p-4">
          <p className="text-muted-foreground text-xs">
            Página {paginaAtual} de {totalPaginas} · {formatarNumero(itensFiltrados.length)}{" "}
            registro(s)
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
      </DialogContent>
    </Dialog>
  );
}
