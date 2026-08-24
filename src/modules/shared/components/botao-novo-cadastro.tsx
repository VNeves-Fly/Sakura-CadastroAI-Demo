"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotaoNovoCadastroBaseProps {
  label?: string;
  className?: string;
  // "gradient" (default) é o visual único pra essa ação em todo o Admin
  // (pedido do usuário, 2026-08-17). "solid" é a exceção pixel-perfect de
  // Executivos/Gestores (mockup Claude Design, 2026-08-24: rosa sólido
  // #F53D9A, sem gradiente) — usar só onde a SPEC pedir explicitamente,
  // não como alternativa livre.
  variant?: "gradient" | "solid";
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
const CLASSE_GRADIENTE =
  "from-pink-glow to-violet-glow inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:opacity-90";

const CLASSE_SOLIDA =
  "inline-flex h-[38px] items-center gap-2.5 rounded-full bg-[#F53D9A] px-[18px] text-[13.5px] font-semibold whitespace-nowrap text-white shadow-[0_4px_20px_rgba(245,61,154,0.35)] transition active:scale-[0.97]";

export function BotaoNovoCadastro(props: BotaoNovoCadastroProps) {
  const { label = "Novo cadastro", className, variant = "gradient" } = props;
  const classeBase = variant === "solid" ? CLASSE_SOLIDA : CLASSE_GRADIENTE;
  const conteudo = (
    <>
      <Plus className={variant === "solid" ? "size-[15px]" : "size-4"} />
      {label}
    </>
  );

  if (props.href) {
    return (
      <Link href={props.href} className={cn(classeBase, className)}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={cn(classeBase, className)}>
      {conteudo}
    </button>
  );
}
