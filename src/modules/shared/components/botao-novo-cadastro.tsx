"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotaoNovoCadastroBaseProps {
  label?: string;
  className?: string;
}

interface BotaoNovoCadastroLinkProps extends BotaoNovoCadastroBaseProps {
  href: string;
  onClick?: never;
}

interface BotaoNovoCadastroButtonProps extends BotaoNovoCadastroBaseProps {
  href?: never;
  onClick: () => void;
}

type BotaoNovoCadastroProps = BotaoNovoCadastroLinkProps | BotaoNovoCadastroButtonProps;

// Pílula "+ Novo cadastro" em gradiente rosa→roxo — único visual pra essa
// ação em todo o Admin (Executivos, Gestores, ...), pedido do usuário
// 2026-08-17 pra não ter dois botões diferentes pra mesma coisa em módulos
// irmãos. `href` navega (ex.: Executivos, que abre uma página própria);
// `onClick` só dispara uma ação (ex.: Gestores, que abre um modal).
const CLASSE_BASE =
  "from-pink-glow to-violet-glow inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:opacity-90";

export function BotaoNovoCadastro(props: BotaoNovoCadastroProps) {
  const { label = "Novo cadastro", className } = props;
  const conteudo = (
    <>
      <Plus className="size-4" />
      {label}
    </>
  );

  if (props.href) {
    return (
      <Link href={props.href} className={cn(CLASSE_BASE, className)}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={cn(CLASSE_BASE, className)}>
      {conteudo}
    </button>
  );
}
