"use client";

import { useState } from "react";

const INPUT_CLASSNAME =
  "min-w-0 flex-1 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-mono text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

// ID do contrato gerado pelo D4Sign (Contrato.provedorId) — mas alguns
// contratos são assinados por fora da plataforma (fisicamente ou por
// outro meio), sem nunca passar pelo D4Sign. Enquanto não existe campo
// no banco pra guardar isso de verdade, deixa o analista registrar aqui
// (só nesta tela, some se recarregar) o ID de referência desse contrato
// externo — a tag vermelha deixa claro que aquele ID não veio do D4Sign.
export function ContratoIdManual({ provedorId }: { provedorId: string }) {
  const [idManual, setIdManual] = useState("");
  const [rascunho, setRascunho] = useState("");
  const [editando, setEditando] = useState(false);

  const idExibido = idManual || provedorId;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-semibold break-all">
          {idExibido}
        </span>
        {idManual ? (
          <span className="bg-destructive/15 text-destructive rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
            Contrato não assinado na plataforma
          </span>
        ) : null}
      </div>

      {editando ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={rascunho}
            onChange={(event) => setRascunho(event.target.value)}
            placeholder="Cole aqui o ID do contrato assinado por fora"
            className={INPUT_CLASSNAME}
          />
          <button
            type="button"
            disabled={rascunho.trim().length === 0}
            onClick={() => {
              setIdManual(rascunho.trim());
              setEditando(false);
            }}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditando(false);
              setRascunho("");
            }}
            className="border-input text-foreground hover:bg-accent shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setRascunho(idManual);
            setEditando(true);
          }}
          className="text-primary self-start text-xs font-semibold hover:underline"
        >
          {idManual
            ? "Editar ID do contrato assinado por fora"
            : "Contrato assinado por fora da plataforma?"}
        </button>
      )}
    </div>
  );
}
