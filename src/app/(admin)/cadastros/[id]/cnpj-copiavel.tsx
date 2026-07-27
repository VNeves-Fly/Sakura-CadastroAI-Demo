"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";

interface CnpjCopiavelProps {
  cnpj: string;
}

export function CnpjCopiavel({ cnpj }: CnpjCopiavelProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(cnpj);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      title="Copiar CNPJ"
      className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-base font-bold transition ${
        copiado
          ? "bg-success-bg text-success-text"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      {maskCnpj(cnpj)}
      {copiado ? (
        <Check className="animate-in fade-in-0 zoom-in-95 size-4" />
      ) : (
        <Copy className="size-3.5 opacity-60" />
      )}
    </button>
  );
}
