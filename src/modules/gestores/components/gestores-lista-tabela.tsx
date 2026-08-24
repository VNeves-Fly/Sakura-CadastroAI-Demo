"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import { labelDoNivel } from "@/modules/gestores/types/gestor-nivel.types";
import type { GestorListaView } from "@/modules/gestores/types/gestor-lista.types";
import { cn } from "@/lib/utils";

interface GestoresListaTabelaProps {
  gestores: GestorListaView[];
  isLoading: boolean;
  error: string | null;
  onEditar: (gestorId: string) => void;
}

// Grid de colunas idêntico no header e nas linhas (mockup Claude Design,
// 2026-08-24, "Gestores").
const COLS =
  "minmax(200px,1.6fr) minmax(140px,1fr) minmax(110px,0.8fr) minmax(130px,1fr) minmax(130px,1fr) 90px";

type ColunaChave = "nome" | "nivel" | "executivos" | "vendasMes" | "vendasAno";
type Direcao = "asc" | "desc";

const COLUNAS: { chave: ColunaChave; label: string; centralizada?: boolean }[] = [
  { chave: "nome", label: "Gerente" },
  { chave: "nivel", label: "Nível", centralizada: true },
  { chave: "executivos", label: "Executivos", centralizada: true },
  { chave: "vendasMes", label: "Vendas mês", centralizada: true },
  { chave: "vendasAno", label: "Vendas ano", centralizada: true },
];

function valorOrdenavel(linha: GestorListaView, chave: ColunaChave): string | number {
  if (chave === "nivel") return labelDoNivel(linha.nivel);
  return linha[chave];
}

// Tabela pixel-perfect (mockup Claude Design, 2026-08-24, "Gestores") —
// mesmo padrão de grid-de-divs de executivos-lista-tabela.tsx, não
// SortableDataTable/<Table> genérica nem StickyHorizontalScrollbar (o
// mockup não precisa — só 6 colunas, mais estreitas que a versão
// anterior). Colunas reduzidas ao que o mockup mostra — Total/Vend.30d/
// Paradas+90d/Limite/Saúde e o botão Inativar/Ativar saíram da lista (o
// Inativar/Ativar continua no modal de edição, ver gestor-edicao-modal.tsx
// — nenhuma funcionalidade foi perdida, só saiu da linha). Máscara de
// dados sensíveis (SensitiveValue) também saiu — o mockup não tem o botão
// de olho na toolbar. Pedido do usuário, 2026-08-24: restilizar
// /crm/gestores "pixel perfect" com o modelo fornecido.
export function GestoresListaTabela({
  gestores,
  isLoading,
  error,
  onEditar,
}: GestoresListaTabelaProps) {
  const router = useRouter();
  const [sort, setSort] = useState<{ chave: ColunaChave; direcao: Direcao }>({
    chave: "vendasAno",
    direcao: "desc",
  });

  const linhasOrdenadas = useMemo(() => {
    const sinal = sort.direcao === "asc" ? 1 : -1;
    return [...gestores].sort((a, b) => {
      const valorA = valorOrdenavel(a, sort.chave);
      const valorB = valorOrdenavel(b, sort.chave);
      if (typeof valorA === "number" && typeof valorB === "number") {
        return (valorA - valorB) * sinal;
      }
      return String(valorA).localeCompare(String(valorB)) * sinal;
    });
  }, [gestores, sort]);

  function alternarOrdenacao(chave: ColunaChave) {
    setSort((atual) => {
      if (atual.chave !== chave) return { chave, direcao: "desc" };
      return { chave, direcao: atual.direcao === "desc" ? "asc" : "desc" };
    });
  }

  if (isLoading) {
    return <p className="text-sm text-[#6B6B85]">Carregando gestores...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 900 }}>
        <div
          className="grid items-center gap-4 rounded-t-lg border-t border-b border-[#F7DCEB] bg-[#FBFBFE] px-4 py-3.5"
          style={{ gridTemplateColumns: COLS }}
        >
          {COLUNAS.map((coluna) => (
            <button
              key={coluna.chave}
              type="button"
              onClick={() => alternarOrdenacao(coluna.chave)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 bg-transparent p-0 text-[11.5px] font-semibold tracking-[0.06em] text-[#6B6B85] uppercase",
                coluna.centralizada && "justify-center",
              )}
            >
              {coluna.label}
              <span className="text-[10px]">
                {sort.chave === coluna.chave ? (sort.direcao === "asc" ? "↑" : "↓") : "⇅"}
              </span>
            </button>
          ))}
          <span />
        </div>

        {linhasOrdenadas.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#6B6B85]">Nenhum gestor encontrado.</p>
        ) : (
          linhasOrdenadas.map((linha) => (
            <div
              key={linha.id}
              onClick={() => router.push(`/crm/gestores/${linha.id}`)}
              className="grid cursor-pointer items-center gap-4 border-b border-[#F7DCEB] bg-white px-4 py-3.5 text-[13px] text-[#2A2A40] hover:bg-[#FAFAFC]"
              style={{ gridTemplateColumns: COLS }}
            >
              <div className="flex min-w-0 items-center gap-2.5 pr-1">
                <span className="truncate text-[13px] font-medium tracking-[0.01em] text-[#1A1A2E]">
                  {linha.nome}
                </span>
                {linha.semVenda ? (
                  <span className="shrink-0 rounded-full bg-[#F2F2F8] px-2 py-0.5 text-[10.5px] font-semibold text-[#6B6B85]">
                    Sem venda
                  </span>
                ) : null}
              </div>
              <div className="flex justify-center">
                <span className="rounded-full border border-[rgba(245,61,154,0.28)] bg-[rgba(245,61,154,0.10)] px-2.5 py-[3px] text-[11.5px] font-medium text-[#E0348B]">
                  {labelDoNivel(linha.nivel)}
                </span>
              </div>
              <span className="text-center tabular-nums">{linha.executivos}</span>
              <span className="text-center tabular-nums">
                {formatarMoedaAbreviada(linha.vendasMes)}
              </span>
              <span className="text-center font-semibold text-[#2A2A40] tabular-nums">
                {formatarMoedaAbreviada(linha.vendasAno)}
              </span>
              <div
                className="flex items-center justify-end"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onEditar(linha.id)}
                  className="text-[12.5px] font-semibold text-[#C2185B] hover:text-[#E91E8C]"
                >
                  Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
