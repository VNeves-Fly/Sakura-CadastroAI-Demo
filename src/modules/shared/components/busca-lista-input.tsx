"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BuscaListaInputProps {
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  className?: string;
}

// Campo de busca com ícone de lupa — mesmo visual em toda listagem do Admin
// (Executivos, Gestores, ...). Estava duplicado em cada toolbar (mesma
// marcação copiada de arquivo pra arquivo); extraído aqui pra ter uma única
// fonte de verdade (pedido do usuário, 2026-08-17).
export function BuscaListaInput({ value, onChange, placeholder, className }: BuscaListaInputProps) {
  return (
    <div className={cn("relative w-full max-w-[230px]", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-full pl-8"
      />
    </div>
  );
}
