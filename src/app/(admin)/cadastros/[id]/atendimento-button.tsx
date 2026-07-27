"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageCircle, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OpcaoTelefoneAtendimento } from "@/modules/admin/adapters/dossie.adapter";
import { assumirAtendimentoDossieAction } from "./actions";

const BOTAO_CLASSES =
  "border-input text-foreground hover:bg-accent flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

export interface OpcaoAtendimentoDossie extends OpcaoTelefoneAtendimento {
  // null quando nunca houve troca de mensagem pra esse telefone — nesse
  // caso não existe Conversa pra assumir, o clique só navega, como sempre
  // fez.
  conversaId: string | null;
  atendimentoAtual: { analistaNome: string; assumidoEm: string; liberadoEm: string | null } | null;
}

function hrefAtendimento(telefone: string): string {
  return `/atendimento?telefone=${encodeURIComponent(telefone)}`;
}

function labelBotao(opcao: OpcaoAtendimentoDossie, analistaAtual: string): string {
  if (!opcao.atendimentoAtual) return "Atender";
  if (opcao.atendimentoAtual.analistaNome === analistaAtual) return "Continuar atendimento";
  return "Puxar atendimento";
}

function statusOpcao(opcao: OpcaoAtendimentoDossie, analistaAtual: string): string {
  if (!opcao.atendimentoAtual) return "Livre";
  if (opcao.atendimentoAtual.analistaNome === analistaAtual) return "Por você";
  return `Em atendimento por ${opcao.atendimentoAtual.analistaNome}`;
}

// Atalho pro chat daquela agência (ver /atendimento?telefone=, lido em
// useAtendimento) — quando há mais de um número cadastrado (comercial +
// sócios), o analista escolhe qual contato quer atender antes de navegar.
// Quando já existe uma Conversa de verdade pro telefone escolhido, clicar
// chama a MESMA use-case de assumir atendimento que /atendimento usa antes
// de navegar (ver assumirAtendimentoDossieAction) — é isso que evita que um
// analista no dossiê e outro em /atendimento peguem a mesma pessoa: os
// dois caem na mesma trava de 2h do AssumirAtendimentoUseCase.
export function AtendimentoButton({
  agenciaId,
  opcoes,
  analistaAtual,
}: {
  agenciaId: string;
  opcoes: OpcaoAtendimentoDossie[];
  analistaAtual: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (opcoes.length === 0) return null;

  function selecionar(opcao: OpcaoAtendimentoDossie) {
    setErro(null);
    if (!opcao.conversaId) {
      router.push(hrefAtendimento(opcao.telefone));
      return;
    }
    const conversaId = opcao.conversaId;
    startTransition(async () => {
      const resultado = await assumirAtendimentoDossieAction(agenciaId, conversaId);
      if (resultado.ok) {
        router.push(hrefAtendimento(opcao.telefone));
      } else {
        setErro(resultado.message);
      }
    });
  }

  const [opcao] = opcoes;
  if (opcoes.length === 1 && opcao) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => selecionar(opcao)}
          className={BOTAO_CLASSES}
        >
          <MessageCircle className="size-4" />
          {opcao.conversaId ? labelBotao(opcao, analistaAtual) : "Atendimento"}
        </button>
        {erro ? <p className="text-destructive text-xs">{erro}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger className={BOTAO_CLASSES}>
          <MessageCircle className="size-4" />
          Atendimento
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {opcoes.map((opcao) => (
            <DropdownMenuItem key={opcao.telefone} onClick={() => selecionar(opcao)}>
              <div className="flex flex-col">
                <span className="font-medium">{opcao.label}</span>
                <span className="text-muted-foreground text-xs">{opcao.telefone}</span>
                {opcao.conversaId ? (
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <UserCog className="size-3" />
                    {statusOpcao(opcao, analistaAtual)}
                  </span>
                ) : null}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {erro ? <p className="text-destructive text-xs">{erro}</p> : null}
    </div>
  );
}
