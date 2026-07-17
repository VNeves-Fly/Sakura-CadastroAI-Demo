"use client";

import { useState } from "react";
import { SwipeSwitch } from "./swipe-switch";

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

interface ValidacaoSicaTravelLinkProps {
  agenciaId: string;
  validarContratoAction: (id: string) => Promise<void>;
  recusarCadastroAction: (id: string) => Promise<void>;
}

// SICA e Travel Link ainda não têm campo no schema (decisão explícita:
// nenhuma migration nova sem desenhar com o usuário antes) — esse estado
// só existe aqui, no componente, e some se a página recarregar. Mas o
// bloqueio de "Validar Contrato" enquanto os dois não estiverem
// preenchidos já é a regra de negócio real pedida, só falta persistir.
export function ValidacaoSicaTravelLink({
  agenciaId,
  validarContratoAction,
  recusarCadastroAction,
}: ValidacaoSicaTravelLinkProps) {
  const [sica, setSica] = useState("");
  const [sicaSalvo, setSicaSalvo] = useState(false);
  const [travelLinkAtivo, setTravelLinkAtivo] = useState(false);

  const podeValidar = sicaSalvo && travelLinkAtivo;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="sica" className="text-foreground text-sm font-bold">
          Código SICA
        </label>
        <div className="flex gap-2">
          <input
            id="sica"
            type="text"
            inputMode="numeric"
            value={sica}
            disabled={sicaSalvo}
            onChange={(event) => setSica(event.target.value.replace(/\D/g, ""))}
            placeholder="Somente números"
            className={`${INPUT_CLASSNAME} min-w-0 flex-1`}
          />
          {sicaSalvo ? (
            <button
              type="button"
              onClick={() => setSicaSalvo(false)}
              className="border-input text-foreground hover:bg-accent shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition"
            >
              Editar
            </button>
          ) : (
            <button
              type="button"
              disabled={sica.length === 0}
              onClick={() => setSicaSalvo(true)}
              className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar
            </button>
          )}
        </div>
        {sicaSalvo ? <span className="text-success text-xs font-medium">✓ SICA salvo</span> : null}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-foreground text-sm font-bold">Travel Link criado</span>
        <SwipeSwitch id="travel-link" checked={travelLinkAtivo} onChange={setTravelLinkAtivo} />
      </div>

      <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
        <strong className="text-foreground">Ainda não salva de verdade:</strong> SICA e Travel Link
        não têm campo no banco ainda — esse estado só vive aqui na tela (some se recarregar a
        página). O bloqueio abaixo já é real: sem os dois preenchidos, não dá pra validar.
      </div>

      <div className="flex flex-wrap gap-2">
        <form action={validarContratoAction.bind(null, agenciaId)}>
          <button
            type="submit"
            disabled={!podeValidar}
            title={
              podeValidar
                ? undefined
                : "Salve o código SICA e confirme o Travel Link antes de validar"
            }
            className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Validar Contrato
          </button>
        </form>
        <form action={recusarCadastroAction.bind(null, agenciaId)}>
          <button
            type="submit"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full border px-4 py-2 text-sm font-medium transition"
          >
            Recusar
          </button>
        </form>
      </div>
    </div>
  );
}
