"use client";

import { useState } from "react";
import { SwipeSwitch } from "./swipe-switch";
import type { CampoInlineForm } from "./types";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface InlineFormCardProps {
  titulo: string;
  campos: CampoInlineForm[];
  onConfirmar: (valores: Record<string, string | boolean>) => void;
}

const INPUT_CLASSNAME =
  "rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/40 focus:border-accent";

export function InlineFormCard({ titulo, campos, onConfirmar }: InlineFormCardProps) {
  const [valores, setValores] = useState<Record<string, string | boolean>>({});

  const obrigatoriosPreenchidos = campos
    .filter((campo) => campo.obrigatorio)
    .every((campo) => String(valores[campo.nome] ?? "").trim().length > 0);

  function atualizar(nome: string, valor: string | boolean) {
    setValores((atual) => ({ ...atual, [nome]: valor }));
  }

  return (
    <div className="mb-4 ml-9 max-w-[85%] rounded-2xl rounded-bl-none bg-white/10 p-4">
      <span className="text-accent mb-3 block text-[10px] font-bold tracking-wide uppercase">
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
                inputMode={campo.nome === "cep" ? "numeric" : undefined}
                placeholder={campo.placeholder}
                value={String(valores[campo.nome] ?? "")}
                onChange={(event) => {
                  const bruto = event.target.value;
                  const valor = campo.nome === "cep" ? bruto.replace(/\D/g, "").slice(0, 8) : bruto;
                  atualizar(campo.nome, valor);
                }}
                className={INPUT_CLASSNAME}
              />
            ) : null}
            {campo.tipo === "select" ? (
              <Select
                value={String(valores[campo.nome] ?? "")}
                onValueChange={(valor) => atualizar(campo.nome, valor ?? "")}
              >
                <SelectTrigger className="focus:border-accent border-white/20 bg-white/10 text-white focus:ring-0">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-zinc-900/95 text-white backdrop-blur-md">
                  {campo.opcoes?.map((opcao) => (
                    <SelectItem
                      key={opcao.valor}
                      value={opcao.valor}
                      className="data-highlighted:bg-white/10 data-highlighted:text-white"
                    >
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {campo.tipo === "checkbox" ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-white/80">{campo.label}</span>
                <SwipeSwitch
                  id={campo.nome}
                  checked={Boolean(valores[campo.nome])}
                  onChange={(valor) => atualizar(campo.nome, valor)}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={!obrigatoriosPreenchidos}
        onClick={() => onConfirmar(valores)}
        className="bg-primary hover:bg-secondary mt-3 w-full rounded-full px-3 py-2 text-[11px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Confirmar
      </button>
    </div>
  );
}
