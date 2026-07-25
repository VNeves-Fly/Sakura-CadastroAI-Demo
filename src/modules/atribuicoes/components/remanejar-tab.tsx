import Link from "next/link";
import type {
  ResumoBase,
  ResumoExecutivo,
  ResumoGestor,
} from "@/modules/atribuicoes/types/atribuicao.types";

interface RemanejarTabProps {
  executivos: ResumoExecutivo[];
  gestores: ResumoGestor[];
  bases: ResumoBase[];
}

function ColunaRemanejamento({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { chave: string; nome: string; totalCidades: number; href: string }[];
}) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-2xl border">
      <p className="text-muted-foreground border-border bg-muted/40 rounded-t-2xl border-b px-4 py-2.5 text-xs font-bold tracking-wide uppercase">
        {titulo}
      </p>
      <ul className="divide-border flex max-h-96 flex-col divide-y overflow-y-auto px-2 pb-2">
        {itens.map((item) => (
          <li key={item.chave}>
            <Link
              href={item.href}
              className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm transition"
            >
              <span className="text-foreground font-medium">{item.nome}</span>
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                {item.totalCidades} cidade(s)
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Único lugar do módulo onde se transfere/substitui executivo, gestor
// ou base — antes existia um link "Substituir" espalhado nas tabelas de
// Executivos/Gestores e nas fichas de colaborador, o que confundia (não
// ficava claro que mexer ali reatribuía TODAS as cidades da pessoa/base).
// Centralizado aqui, cada item leva pro mesmo formulário de
// /atribuicoes/substituir que já existia.
export function RemanejarTab({ executivos, gestores, bases }: RemanejarTabProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-muted-foreground text-sm">
        Escolha um executivo, gestor ou base pra transferir todas as cidades atendidas por ele(a)
        pra outro nome já existente ou recém-criado.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ColunaRemanejamento
          titulo={`Executivos (${executivos.length})`}
          itens={executivos.map((item) => ({
            chave: item.executivo,
            nome: item.executivo,
            totalCidades: item.totalCidades,
            href: `/atribuicoes/substituir?tipo=executivo&nome=${encodeURIComponent(item.executivo)}`,
          }))}
        />
        <ColunaRemanejamento
          titulo={`Gestores (${gestores.length})`}
          itens={gestores.map((item) => ({
            chave: item.gestor,
            nome: item.gestor,
            totalCidades: item.totalCidades,
            href: `/atribuicoes/substituir?tipo=gestor&nome=${encodeURIComponent(item.gestor)}`,
          }))}
        />
        <ColunaRemanejamento
          titulo={`Bases (${bases.length})`}
          itens={bases.map((item) => ({
            chave: item.base,
            nome: item.base,
            totalCidades: item.totalCidades,
            href: `/atribuicoes/substituir?tipo=base&nome=${encodeURIComponent(item.base)}`,
          }))}
        />
      </div>
    </div>
  );
}
