"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OpcaoTelefoneAtendimento } from "@/modules/admin/adapters/dossie.adapter";

const BOTAO_CLASSES =
  "border-input text-foreground hover:bg-accent flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition";

function hrefAtendimento(telefone: string): string {
  return `/atendimento?telefone=${encodeURIComponent(telefone)}`;
}

// Atalho pro chat daquela agência (ver /atendimento?telefone=, lido em
// useAtendimento) — quando há mais de um número cadastrado (comercial +
// sócios), o analista escolhe qual contato quer atender antes de navegar,
// em vez de sempre cair no primeiro.
export function AtendimentoButton({ opcoes }: { opcoes: OpcaoTelefoneAtendimento[] }) {
  const router = useRouter();

  if (opcoes.length <= 1) {
    const telefone = opcoes[0]?.telefone;
    if (!telefone) return null;

    return (
      <Link href={hrefAtendimento(telefone)} className={BOTAO_CLASSES}>
        <MessageCircle className="size-4" />
        Atendimento
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={BOTAO_CLASSES}>
        <MessageCircle className="size-4" />
        Atendimento
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {opcoes.map((opcao) => (
          <DropdownMenuItem
            key={opcao.telefone}
            onClick={() => router.push(hrefAtendimento(opcao.telefone))}
          >
            <div className="flex flex-col">
              <span className="font-medium">{opcao.label}</span>
              <span className="text-muted-foreground text-xs">{opcao.telefone}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
