"use client";

import { useState, type KeyboardEvent } from "react";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { maskCpf } from "@/modules/cadastro/utils/cpf.util";
import { maskTelefone } from "@/modules/shared/utils/telefone.util";
import type { PendingInput } from "./types";

interface MessageBoxProps {
  pending: PendingInput | null;
  onEnviar: (valor: string) => void;
}

function aplicarMascara(valor: string, pending: PendingInput | null): string {
  if (!pending || pending.kind !== "texto") return valor;
  if (pending.tag === "cnpj") return maskCnpj(valor);
  if (pending.tag === "cpf") return maskCpf(valor);
  if (pending.tag === "telefone") return maskTelefone(valor, "BR");
  return valor;
}

export function MessageBox({ pending, onEnviar }: MessageBoxProps) {
  const [valor, setValor] = useState("");
  const habilitado = pending?.kind === "texto";

  function enviar() {
    if (!habilitado || valor.trim().length === 0) return;
    onEnviar(valor);
    setValor("");
  }

  function aoTeclar(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      enviar();
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-white/10 bg-black/20 px-4 py-3">
      <textarea
        value={valor}
        disabled={!habilitado}
        onChange={(event) => setValor(aplicarMascara(event.target.value, pending))}
        onKeyDown={aoTeclar}
        placeholder={
          habilitado && pending?.kind === "texto"
            ? pending.placeholder
            : "Escolha uma opção acima..."
        }
        rows={1}
        className="min-w-0 flex-1 resize-none bg-transparent text-[11px] text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        disabled={!habilitado || valor.trim().length === 0}
        onClick={enviar}
        className="bg-sakura-500 hover:bg-sakura-600 shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-wide text-white uppercase transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Enviar
      </button>
    </div>
  );
}
