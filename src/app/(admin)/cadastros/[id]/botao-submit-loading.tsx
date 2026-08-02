"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

interface BotaoSubmitComLoadingProps {
  children: ReactNode;
  labelCarregando: string;
  className: string;
  disabled?: boolean;
  title?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

// Spinner de "enviando" pros forms de ação simples (um botão só, sem
// campo extra) que vivem direto num Server Component (page.tsx) — usa
// useFormStatus (só funciona em filho do <form>, por isso não dá pra ler
// `pending` na própria page) em vez de useState local, já que a page não
// é "use client". Mesmo padrão visual (Loader2 + aria-busy) já usado nos
// modais que têm loading (CancelarContratoModal/AprovarComplementarModal/
// ForcarAvancoModal) — só que reaproveitável pra qualquer form de um botão
// só, sem precisar duplicar o estado em cada componente novo.
export function BotaoSubmitComLoading({
  children,
  labelCarregando,
  className,
  disabled = false,
  title,
  onClick,
}: BotaoSubmitComLoadingProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      title={title}
      onClick={onClick}
      className={className}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending ? labelCarregando : children}
    </button>
  );
}
