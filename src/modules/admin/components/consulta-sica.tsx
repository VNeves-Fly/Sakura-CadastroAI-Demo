"use client";

import { Building2 } from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import { Campo, CamposGrid } from "@/modules/admin/components/dossie-campos";
import { formatarData } from "@/modules/admin/utils/dossie-campos.util";
import {
  BotaoReconsultar,
  HistoricoConsultas,
} from "@/modules/admin/components/consulta-amat-sofia";
import type { ConsultaSicaView } from "@/modules/admin/types/dossie.types";

// Mesma checagem, dois jeitos de aparecer: automática por CNPJ (ao
// finalizar o cadastro) ou confirmação manual por código (ao salvar o
// SICA) — ver ConsultaSicaAtualView.metodo em dossie.types.ts.
const LABEL_METODO: Record<"cnpj" | "codigo_empresa", string> = {
  cnpj: "checagem automática por CNPJ",
  codigo_empresa: "confirmação do código SICA",
};

function AvisoNaoConsultado() {
  return (
    <p className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-3 py-2 text-xs">
      Ainda não consultado — a verificação roda automaticamente ao finalizar o cadastro.
    </p>
  );
}

// Verde quando ativo (empresa já opera no SICA), âmbar quando inativo —
// nem "ativo" nem "inativo" são necessariamente uma notícia ruim, então
// nenhum dos dois vira "negativo" (vermelho, reservado pra problema real).
function BadgeStatusSica({ status }: { status: "ativo" | "inativo" | null }) {
  if (!status) return null;
  const ativo = status === "ativo";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
        ativo ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
      }`}
    >
      {status}
    </span>
  );
}

// Consulta ao SST (SICA) — ver ConsultarSicaUseCase/SalvarSicaUseCase.
// Cadastro novo normalmente não encontra nada (não é um problema, ver
// AvisoNaoConsultado/mensagem de "não encontrado" abaixo) — variante
// sempre "neutro", sem tingir o card de vermelho/verde por isso.
export function ConsultaSicaCard({
  consulta,
  reconsultar,
}: {
  consulta: ConsultaSicaView;
  reconsultar?: () => Promise<void>;
}) {
  const { atual, historico } = consulta;

  return (
    <SecaoColapsavel titulo="SICA (SST)" icon={<Building2 className="size-4" />}>
      <div className="flex flex-col gap-3">
        {!atual ? (
          <AvisoNaoConsultado />
        ) : !atual.encontrado ? (
          <p className="text-muted-foreground text-sm">
            Não encontrado no SICA — cadastro novo, sem histórico prévio.
          </p>
        ) : (
          <>
            <CamposGrid>
              <Campo label="Situação no SICA">
                <BadgeStatusSica status={atual.empresaStatus} />
              </Campo>
              <Campo label="Código da empresa">{atual.codigoEmpresa ?? "—"}</Campo>
              <Campo label="Nome no SICA">{atual.nomeEmpresa ?? "—"}</Campo>
              <Campo label="Telefone">{atual.telefone ?? "—"}</Campo>
              <Campo label="E-mail">{atual.email ?? "—"}</Campo>
              <Campo label="Executivo">
                {atual.nomeExecutivo ?? "—"}
                {atual.codigoExecutivo ? ` (${atual.codigoExecutivo})` : ""}
              </Campo>
            </CamposGrid>
            <p className="text-muted-foreground text-xs">
              {LABEL_METODO[atual.metodo]} — {formatarData(atual.consultadoEm)}
            </p>
          </>
        )}

        <HistoricoConsultas historico={historico} />

        {reconsultar ? (
          <form action={reconsultar} className="flex justify-end">
            <BotaoReconsultar />
          </form>
        ) : null}
      </div>
    </SecaoColapsavel>
  );
}
