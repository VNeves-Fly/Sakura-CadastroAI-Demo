"use client";

import { useState } from "react";
import type { CampoInlineForm } from "./types";

interface InlineFormCardProps {
  titulo: string;
  campos: CampoInlineForm[];
  onConfirmar: (valores: Record<string, string | boolean>) => void;
}

const INPUT_CLASSNAME =
  "rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/40 focus:border-sakura-300";

export function InlineFormCard({ titulo, campos, onConfirmar }: InlineFormCardProps) {
  const [valores, setValores] = useState<Record<string, string | boolean>>({});

  const obrigatoriosPreenchidos = campos
    .filter((campo) => campo.obrigatorio)
    .every((campo) => String(valores[campo.nome] ?? "").trim().length > 0);

  function atualizar(nome: string, valor: string | boolean) {
    setValores((atual) => ({ ...atual, [nome]: valor }));
  }

  return (
    <div className="mb-4 ml-9 max-w-[260px] rounded-2xl rounded-bl-none bg-white/10 p-4">
      <span className="text-sakura-300 mb-3 block text-[10px] font-bold tracking-wide uppercase">
        {titulo}
      </span>
      <div className="flex flex-col gap-2.5">
        {campos.map((campo) => (
          <div key={campo.nome} className="flex flex-col gap-1">
            {campo.tipo !== "checkbox" ? (
              <label className="text-[10px] font-medium text-white/60">{campo.label}</label>
            ) : null}
            {campo.tipo === "text" ? (
              <input
                type="text"
                placeholder={campo.placeholder}
                value={String(valores[campo.nome] ?? "")}
                onChange={(event) => atualizar(campo.nome, event.target.value)}
                className={INPUT_CLASSNAME}
              />
            ) : null}
            {campo.tipo === "select" ? (
              <select
                value={String(valores[campo.nome] ?? "")}
                onChange={(event) => atualizar(campo.nome, event.target.value)}
                className={`${INPUT_CLASSNAME} [color-scheme:dark]`}
              >
                <option value="" disabled>
                  Selecione
                </option>
                {campo.opcoes?.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            ) : null}
            {campo.tipo === "checkbox" ? (
              <label className="flex items-center gap-2 text-[11px] text-white/80">
                <input
                  type="checkbox"
                  checked={Boolean(valores[campo.nome])}
                  onChange={(event) => atualizar(campo.nome, event.target.checked)}
                />
                {campo.label}
              </label>
            ) : null}
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={!obrigatoriosPreenchidos}
        onClick={() => onConfirmar(valores)}
        className="bg-sakura-500 hover:bg-sakura-600 mt-3 w-full rounded-full px-3 py-2 text-[11px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Confirmar
      </button>
    </div>
  );
}
