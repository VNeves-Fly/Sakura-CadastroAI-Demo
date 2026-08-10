"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeletorTamanhoPaginaProps {
  id?: string;
  valor: number;
  opcoes: readonly number[];
  // Href pronto pra cada opção (já com pageSize + page=1 na querystring),
  // montado pela page (que tem acesso ao searchParams/construirHref) —
  // aqui só navega, sem reconstruir a query string do lado do client.
  hrefPorTamanho: Record<string, string>;
}

export function SeletorTamanhoPagina({
  id,
  valor,
  opcoes,
  hrefPorTamanho,
}: SeletorTamanhoPaginaProps) {
  const router = useRouter();

  return (
    <Select
      value={String(valor)}
      onValueChange={(novoValor) => {
        const href = novoValor ? hrefPorTamanho[novoValor] : undefined;
        if (href) router.push(href);
      }}
    >
      <SelectTrigger id={id} className="w-auto gap-1 rounded-full px-3 py-1.5 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((opcao) => (
          <SelectItem key={opcao} value={String(opcao)}>
            {opcao}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
