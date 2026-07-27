"use client";

import { useState, type ReactNode } from "react";
import { CircleDollarSign, ShieldAlert, X } from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import {
  Campo,
  CamposGrid,
  CamposDetalhe,
  formatarValorExtraido,
} from "@/modules/admin/components/dossie-campos";
import { formatarData, formatarMoedaBrl } from "@/modules/admin/utils/dossie-campos.util";
import type {
  AnaliseIaAmat,
  AnaliseIaAmatPendencias,
  AnaliseIaRawToolCall,
} from "@/modules/cadastro/domain/services/analise-ia-service";

// AMAT/SOFIA reais, lidos do stage2/raw_data que a IA persiste na análise
// final (ver AnaliseCreditoView em dossie.types.ts) — substitui o mock
// front-end que existia antes (mock-amat-sofia.util.ts, removido). `null`
// tanto pra cadastro anterior a esta funcionalidade quanto pra um cadastro
// cujo agente não chegou a rodar o stage2 (ex.: gate de CNAE interrompeu a
// análise antes, ver docs/agency-analysis-params-tracking.md) — os dois
// casos são indistinguíveis daqui, então o aviso é genérico ("ainda não
// consultado"), sem tentar adivinhar o motivo.
function AvisoNaoConsultado() {
  return (
    <p className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-3 py-2 text-xs">
      Ainda não consultado — a verificação roda junto da análise de IA do cadastro.
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
  children: ReactNode;
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

function formatarDataSegura(valor: string): string {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? valor : formatarData(data);
}

// Item individual dentro de uma pendência (ex.: um registro PEFIN) —
// schema não documentado nem do lado do agente (AmatPendenciaItem.itens é
// `additionalProperties: true` no OpenAPI deles, dict livre repassado do
// provedor AMAT) — mesmo tratamento que camposExtraidos/camposExtras já
// recebem em dossie-campos.tsx.
function ItemGenerico({ registro }: { registro: Record<string, unknown> }) {
  const entradas = Object.entries(registro);
  if (entradas.length === 0) return null;

  return (
    <div className="border-border bg-card flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-dashed px-2.5 py-1.5 text-xs">
      {entradas.map(([chave, valor]) => (
        <span key={chave}>
          <span className="text-muted-foreground font-mono">{chave}:</span>{" "}
          <span className="text-foreground">{formatarValorExtraido(valor)}</span>
        </span>
      ))}
    </div>
  );
}

const CATEGORIAS_AMAT = [
  { chave: "pefin", label: "PEFIN" },
  { chave: "refin", label: "REFIN" },
  { chave: "protestos", label: "Protestos" },
  { chave: "chequesSemFundo", label: "Cheques sem fundo" },
  { chave: "dividasVencidas", label: "Dívidas vencidas" },
] as const;

function ResumoPendencias({ pendencias }: { pendencias: AnaliseIaAmatPendencias }) {
  const categorias = CATEGORIAS_AMAT.filter(({ chave }) => pendencias[chave].qtde > 0);

  if (categorias.length === 0) {
    return <span className="text-muted-foreground">Sem pendências.</span>;
  }

  return (
    <span className="text-muted-foreground">
      {categorias
        .map(({ chave, label }) => `${label}: ${formatarMoedaBrl(pendencias[chave].total)}`)
        .join(" + ")}{" "}
      = <strong className="text-foreground">{formatarMoedaBrl(pendencias.totalPendencias)}</strong>
    </span>
  );
}

function DetalhePendencias({ pendencias }: { pendencias: AnaliseIaAmatPendencias }) {
  const categorias = CATEGORIAS_AMAT.filter(({ chave }) => pendencias[chave].qtde > 0);

  if (categorias.length === 0) {
    return <p className="text-muted-foreground text-xs">Nenhuma pendência encontrada.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {categorias.map(({ chave, label }) => {
        const item = pendencias[chave];
        return (
          <div key={chave} className="border-border overflow-hidden rounded-xl border">
            <div className="bg-muted/40 flex items-center justify-between px-3 py-2 text-xs font-bold uppercase">
              <span>
                {label} ({item.qtde})
              </span>
              <span>{formatarMoedaBrl(item.total)}</span>
            </div>
            {item.itens.length > 0 ? (
              <div className="flex flex-col gap-2 px-3 py-2">
                {item.itens.map((registro, index) => (
                  <ItemGenerico key={index} registro={registro} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function saidaComoRegistro(output: unknown): Record<string, unknown> | null {
  if (typeof output === "object" && output !== null && !Array.isArray(output)) {
    return output as Record<string, unknown>;
  }
  return null;
}

// Chamada de tool exatamente como aconteceu (tool/args/output), antes de
// qualquer sumarização em stage1/stage2/stage3 — ver AnaliseIaRawToolCall.
// Complementa o resumo tipado (AMAT) ou o dict genérico (SOFIA) já
// exibidos acima no modal, dando o payload bruto do provedor pra auditoria.
function ChamadasBrutas({ chamadas }: { chamadas: AnaliseIaRawToolCall[] }) {
  if (chamadas.length === 0) return null;

  return (
    <div className="border-border flex flex-col gap-2 border-t border-dashed pt-3">
      <span className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase">
        Chamadas brutas ao provedor ({chamadas.length})
      </span>
      {chamadas.map((chamada, index) => {
        const saida = saidaComoRegistro(chamada.output);
        return (
          <details
            key={index}
            className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5 text-xs"
          >
            <summary className="text-primary cursor-pointer font-semibold">{chamada.tool}</summary>
            <div className="mt-2 flex flex-col gap-2">
              {chamada.args ? <CamposDetalhe titulo="Args" campos={chamada.args} /> : null}
              {saida ? (
                <CamposDetalhe titulo="Output" campos={saida} />
              ) : (
                <p className="text-muted-foreground">
                  Output: {formatarValorExtraido(chamada.output)}
                </p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function ConsultaAmatCard({
  amat,
  rawAmat,
}: {
  amat: AnaliseIaAmat | null;
  rawAmat: AnaliseIaRawToolCall[];
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const dados = amat?.consultado ? amat : null;

  return (
    <SecaoColapsavel titulo="AMAT — Dívidas" icon={<CircleDollarSign className="size-4" />}>
      <div className="flex flex-col gap-3">
        {!dados ? (
          <AvisoNaoConsultado />
        ) : (
          <>
            <CamposGrid>
              <Campo label="Dívida Total (AMAT)">
                <span className="text-lg font-bold">{formatarMoedaBrl(dados.totalGeral)}</span>
              </Campo>
              <Campo label="Sócios com restrição">{dados.sociosComRestricao.length}</Campo>
            </CamposGrid>

            {dados.empresa ? (
              <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm">
                <span className="text-foreground font-medium">Agência (CNPJ)</span>
                <ResumoPendencias pendencias={dados.empresa} />
              </div>
            ) : null}

            {dados.sociosComRestricao.map((socio) => (
              <div
                key={socio.cpf}
                className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm"
              >
                <span className="text-foreground font-medium">
                  {socio.nome}
                  {socio.cargo ? ` — ${socio.cargo}` : ""}
                </span>
                <ResumoPendencias pendencias={socio.pendencias} />
              </div>
            ))}

            {dados.ultimaConsulta ? (
              <p className="text-muted-foreground text-xs">
                Última consulta: {formatarDataSegura(dados.ultimaConsulta)}
              </p>
            ) : null}
          </>
        )}

        <BotaoVerTudo onClick={() => setModalAberto(true)} />
      </div>

      <ModalVerTudo
        titulo="AMAT — Todos os dados"
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        {dados ? (
          <>
            {dados.empresa ? (
              <div className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-semibold">Agência (CNPJ)</span>
                <DetalhePendencias pendencias={dados.empresa} />
              </div>
            ) : null}
            {dados.sociosComRestricao.map((socio) => (
              <div key={socio.cpf} className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-semibold">
                  {socio.nome}
                  {socio.cargo ? ` — ${socio.cargo}` : ""}
                </span>
                <DetalhePendencias pendencias={socio.pendencias} />
              </div>
            ))}
          </>
        ) : (
          <p className="text-muted-foreground text-xs">Ainda não consultado.</p>
        )}
        <ChamadasBrutas chamadas={rawAmat} />
      </ModalVerTudo>
    </SecaoColapsavel>
  );
}

export function ConsultaSofiaCard({
  sofia,
  rawSofia,
}: {
  sofia: Record<string, unknown> | null;
  rawSofia: AnaliseIaRawToolCall[];
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const entradas = sofia ? Object.entries(sofia) : [];

  return (
    <SecaoColapsavel titulo="SOFIA — Reputação" icon={<ShieldAlert className="size-4" />}>
      <div className="flex flex-col gap-3">
        {!sofia ? (
          <AvisoNaoConsultado />
        ) : entradas.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Consulta feita, sem dado estruturado retornado.
          </p>
        ) : (
          <div className="border-border bg-muted/30 flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-sm">
            {entradas.map(([chave, valor]) => (
              <div key={chave} className="flex flex-wrap justify-between gap-2">
                <span className="text-muted-foreground font-mono text-xs">{chave}</span>
                <span className="text-foreground font-medium">{formatarValorExtraido(valor)}</span>
              </div>
            ))}
          </div>
        )}

        <BotaoVerTudo onClick={() => setModalAberto(true)} />
      </div>

      <ModalVerTudo
        titulo="SOFIA — Todos os dados"
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        {!sofia && rawSofia.length === 0 ? (
          <p className="text-muted-foreground text-xs">Ainda não consultado.</p>
        ) : null}
        <ChamadasBrutas chamadas={rawSofia} />
      </ModalVerTudo>
    </SecaoColapsavel>
  );
}
