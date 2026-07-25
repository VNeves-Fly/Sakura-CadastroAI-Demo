import { CircleDollarSign, ShieldAlert } from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import { Campo, CamposGrid, formatarMoedaBrl } from "@/modules/admin/components/dossie-campos";
import type {
  ConsultaAmat,
  ConsultaSofia,
  StatusSofia,
} from "@/modules/admin/utils/mock-amat-sofia.util";

// Aviso de transparência: enquanto AMAT/SOFIA não tiverem API real, o
// analista precisa saber que o dado é simulado — nunca apresentar mock
// como se fosse consulta de verdade (ver mock-amat-sofia.util.ts).
function AvisoMock() {
  return (
    <p className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-3 py-2 text-xs">
      Consulta simulada — ainda sem integração real com AMAT/SOFIA.
    </p>
  );
}

function StatusSofiaBadge({ status }: { status: StatusSofia }) {
  const classes =
    status === "LIMPO"
      ? "bg-success-bg text-success-text"
      : "bg-destructive-bg text-destructive-text";
  const titulo =
    status === "LIMPO"
      ? "Pessoa/agência não encontrada no banco de dados do SOFIA"
      : "Pessoa/agência consta no SOFIA";

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${classes}`}
      title={titulo}
    >
      {status}
    </span>
  );
}

export function ConsultaAmatCard({ amat }: { amat: ConsultaAmat }) {
  return (
    <SecaoColapsavel titulo="AMAT — Dívidas" icon={<CircleDollarSign className="size-4" />}>
      <div className="flex flex-col gap-3">
        <AvisoMock />

        <CamposGrid>
          <Campo label="Dívida Total da Agência">
            <span className="text-lg font-bold">{formatarMoedaBrl(amat.dividaTotalAgencia)}</span>
          </Campo>
          <Campo label="Número de Sócios">{amat.socios.length}</Campo>
        </CamposGrid>

        <div className="flex flex-col gap-2">
          {amat.socios.map((divida, index) => (
            <div
              key={divida.socioId}
              className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm"
            >
              <span className="text-foreground font-medium">
                Dívida Sócio {index + 1} — {divida.nome}
              </span>
              <span className="text-muted-foreground">
                PEFIN: {formatarMoedaBrl(divida.pefin)} + REFIN: {formatarMoedaBrl(divida.refin)} ={" "}
                <strong className="text-foreground">
                  {formatarMoedaBrl(divida.pefin + divida.refin)}
                </strong>
              </span>
            </div>
          ))}
        </div>

        <p className="border-border text-muted-foreground border-t pt-3 text-xs">
          Dívida total ({amat.socios.map((_, index) => `Sócio ${index + 1}`).join(" + ")}):{" "}
          <strong className="text-foreground">{formatarMoedaBrl(amat.dividaTotalAgencia)}</strong>
        </p>
      </div>
    </SecaoColapsavel>
  );
}

export function ConsultaSofiaCard({ sofia }: { sofia: ConsultaSofia }) {
  return (
    <SecaoColapsavel titulo="SOFIA — Reputação" icon={<ShieldAlert className="size-4" />}>
      <div className="flex flex-col gap-3">
        <AvisoMock />

        <div className="flex flex-col gap-2">
          <div className="border-border bg-muted/30 flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm">
            <span className="text-foreground font-medium">Agência (CNPJ)</span>
            <StatusSofiaBadge status={sofia.agenciaStatus} />
          </div>

          {sofia.socios.map((socio) => (
            <div
              key={socio.socioId}
              className="border-border bg-muted/30 flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm"
            >
              <span className="text-foreground font-medium">{socio.nome}</span>
              <StatusSofiaBadge status={socio.status} />
            </div>
          ))}
        </div>
      </div>
    </SecaoColapsavel>
  );
}
