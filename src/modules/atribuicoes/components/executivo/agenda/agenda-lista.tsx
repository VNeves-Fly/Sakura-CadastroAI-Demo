import { TableCell } from "@/components/ui/table";
import { SortableDataTable } from "@/modules/shared/components/sortable-data-table";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { AgendaAgenciaView } from "@/modules/atribuicoes/types/executivo-agenda.types";

interface AgendaListaProps {
  agencias: AgendaAgenciaView[];
}

// Visão "Lista" (SPEC 5.3) — mesma carteira, financeiro do mês (mock),
// coluna Total destacada e linha de rodapé somando as colunas monetárias.
// Sem coluna BASE: AgenciaResumoPromotor não expõe base por agência hoje
// (mesma ressalva do dashboard, ver executivo-detalhe.types.ts).
export function AgendaLista({ agencias }: AgendaListaProps) {
  const hoje = new Date();
  const mesAtual = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const totalGeral = agencias.reduce(
    (acc, agencia) => acc + agencia.aereoNacional + agencia.aereoInternacional + agencia.terrestre,
    0,
  );
  const totais = agencias.reduce(
    (acc, agencia) => ({
      internacional: acc.internacional + agencia.aereoInternacional,
      nacional: acc.nacional + agencia.aereoNacional,
      terrestre: acc.terrestre + agencia.terrestre,
    }),
    { internacional: 0, nacional: 0, terrestre: 0 },
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-semibold">{agencias.length}</span> agência(s) · Mês
        atual ({mesAtual}) · Total{" "}
        <span className="text-primary font-bold">{formatarMoedaAbreviada(totalGeral)}</span>
      </p>

      <div className="border-border bg-card rounded-2xl border">
        <SortableDataTable
          columns={[
            {
              key: "nome",
              label: "Agência",
              sortable: true,
              sortValue: (a) => a.nome,
              render: (a) => (
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">{a.nome}</span>
                  <span className="text-muted-foreground font-mono text-xs">{a.cnpj}</span>
                </div>
              ),
            },
            {
              key: "aereoInternacional",
              label: "Aéreo Internacional",
              align: "right",
              sortable: true,
              sortValue: (a) => a.aereoInternacional,
              render: (a) => <>{formatarMoedaAbreviada(a.aereoInternacional)}</>,
            },
            {
              key: "aereoNacional",
              label: "Aéreo Nacional",
              align: "right",
              sortable: true,
              sortValue: (a) => a.aereoNacional,
              render: (a) => <>{formatarMoedaAbreviada(a.aereoNacional)}</>,
            },
            {
              key: "terrestre",
              label: "Terrestre",
              align: "right",
              sortable: true,
              sortValue: (a) => a.terrestre,
              render: (a) => <>{formatarMoedaAbreviada(a.terrestre)}</>,
            },
            {
              key: "total",
              label: "Total",
              align: "right",
              sortable: true,
              sortValue: (a) => a.aereoNacional + a.aereoInternacional + a.terrestre,
              render: (a) => (
                <span className="text-primary font-bold">
                  {formatarMoedaAbreviada(a.aereoNacional + a.aereoInternacional + a.terrestre)}
                </span>
              ),
            },
          ]}
          rows={agencias}
          rowKey={(a) => a.id}
          defaultSort={{ key: "total", direction: "desc" }}
          emptyMessage="Nenhuma agência na carteira."
          footerCells={(columns) =>
            columns.map((coluna, indice) => (
              <TableCell
                key={coluna.key}
                className={
                  indice === 0 ? "text-foreground font-semibold" : "text-right font-semibold"
                }
              >
                {indice === 0 ? (
                  "Total"
                ) : coluna.key === "aereoInternacional" ? (
                  formatarMoedaAbreviada(totais.internacional)
                ) : coluna.key === "aereoNacional" ? (
                  formatarMoedaAbreviada(totais.nacional)
                ) : coluna.key === "terrestre" ? (
                  formatarMoedaAbreviada(totais.terrestre)
                ) : coluna.key === "total" ? (
                  <span className="text-primary">{formatarMoedaAbreviada(totalGeral)}</span>
                ) : null}
              </TableCell>
            ))
          }
        />
      </div>
    </div>
  );
}
