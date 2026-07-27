"use client";

import { useState } from "react";
import { CircleDollarSign, ShieldAlert, X } from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import { Campo, CamposGrid } from "@/modules/admin/components/dossie-campos";
import { formatarData, formatarMoedaBrl } from "@/modules/admin/utils/dossie-campos.util";
import type {
  AmatOcorrenciaDivida,
  ConsultaAmat,
  ConsultaSofia,
  SofiaOcorrencia,
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

// Casco de modal reaproveitado pelos dois "Ver tudo" abaixo — mesmo padrão
// visual do modal de EditarEmpresaForm (fixed + backdrop + bg-card
// rounded-2xl), só que somente leitura (sem form).
function ModalVerTudo({
  titulo,
  aberto,
  onFechar,
  children,
}: {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onFechar}
    >
      <div
        className="bg-card flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
          <span className="text-foreground min-w-0 truncate text-sm font-semibold">{titulo}</span>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function BotaoVerTudo({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-input text-foreground hover:bg-accent w-fit self-end rounded-full border px-3 py-1 text-xs font-semibold transition"
    >
      Ver tudo
    </button>
  );
}

function TabelaOcorrenciasDivida({ ocorrencias }: { ocorrencias: AmatOcorrenciaDivida[] }) {
  if (ocorrencias.length === 0) {
    return <p className="text-muted-foreground text-xs">Nenhuma ocorrência de dívida.</p>;
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/40 text-muted-foreground uppercase">
          <tr>
            <th className="px-3 py-2 font-bold">Tipo</th>
            <th className="px-3 py-2 font-bold">Credor</th>
            <th className="px-3 py-2 font-bold">Contrato</th>
            <th className="px-3 py-2 font-bold">Data</th>
            <th className="px-3 py-2 text-right font-bold">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {ocorrencias.map((ocorrencia) => (
            <tr key={ocorrencia.id}>
              <td className="px-3 py-2">
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                  {ocorrencia.tipo}
                </span>
              </td>
              <td className="text-foreground px-3 py-2 font-medium">{ocorrencia.credor}</td>
              <td className="text-muted-foreground px-3 py-2 font-mono">{ocorrencia.contrato}</td>
              <td className="text-muted-foreground px-3 py-2">
                {formatarData(ocorrencia.dataInclusao)}
              </td>
              <td className="text-foreground px-3 py-2 text-right font-semibold">
                {formatarMoedaBrl(ocorrencia.valor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListaOcorrenciasSofia({ ocorrencias }: { ocorrencias: SofiaOcorrencia[] }) {
  if (ocorrencias.length === 0) {
    return <p className="text-muted-foreground text-xs">Nenhuma ocorrência registrada.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {ocorrencias.map((ocorrencia) => (
        <li
          key={ocorrencia.id}
          className="border-border bg-muted/30 flex flex-col gap-0.5 rounded-xl border px-3 py-2 text-xs"
        >
          <span className="text-foreground font-semibold">{ocorrencia.motivo}</span>
          <span className="text-muted-foreground">
            Fonte: {ocorrencia.fonte} — {formatarData(ocorrencia.dataInclusao)}
          </span>
        </li>
      ))}
    </ul>
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
  const [modalAberto, setModalAberto] = useState(false);
  const totalOcorrencias = amat.socios.reduce((soma, socio) => soma + socio.ocorrencias.length, 0);

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

        <BotaoVerTudo onClick={() => setModalAberto(true)} />
      </div>

      <ModalVerTudo
        titulo={`AMAT — Todas as ocorrências (${totalOcorrencias})`}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        {amat.socios.map((divida, index) => (
          <div key={divida.socioId} className="flex flex-col gap-2">
            <span className="text-foreground text-sm font-semibold">
              Sócio {index + 1} — {divida.nome}
            </span>
            <TabelaOcorrenciasDivida ocorrencias={divida.ocorrencias} />
          </div>
        ))}
      </ModalVerTudo>
    </SecaoColapsavel>
  );
}

export function ConsultaSofiaCard({ sofia }: { sofia: ConsultaSofia }) {
  const [modalAberto, setModalAberto] = useState(false);
  const totalOcorrencias =
    sofia.agenciaOcorrencias.length +
    sofia.socios.reduce((soma, socio) => soma + socio.ocorrencias.length, 0);

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

        <BotaoVerTudo onClick={() => setModalAberto(true)} />
      </div>

      <ModalVerTudo
        titulo={`SOFIA — Todas as ocorrências (${totalOcorrencias})`}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">Agência (CNPJ)</span>
            <StatusSofiaBadge status={sofia.agenciaStatus} />
          </div>
          <ListaOcorrenciasSofia ocorrencias={sofia.agenciaOcorrencias} />
        </div>

        {sofia.socios.map((socio) => (
          <div key={socio.socioId} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-foreground text-sm font-semibold">{socio.nome}</span>
              <StatusSofiaBadge status={socio.status} />
            </div>
            <ListaOcorrenciasSofia ocorrencias={socio.ocorrencias} />
          </div>
        ))}
      </ModalVerTudo>
    </SecaoColapsavel>
  );
}
