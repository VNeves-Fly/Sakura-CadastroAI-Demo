"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function VoltarButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm font-medium transition"
    >
      <ArrowLeft className="size-4" />
      Voltar
    </button>
  );
}
