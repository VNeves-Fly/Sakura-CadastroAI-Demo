"use client";

import { Lock } from "lucide-react";
import type {
  useCadastroWizardViewModel,
  ExecutivoOption,
} from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
} from "@/components/ui/combobox";

type Passo8ExecutivoAssociacaoProps = ReturnType<typeof useCadastroWizardViewModel>;

// Etapa opcional (nenhum dos dois campos é obrigatório) — atribuição de
// quem indicou o cadastro, usada só pra métricas/comissionamento. Fica por
// último, depois de Banco, por decisão do usuário (2026-07-26).
export function Passo8ExecutivoAssociacao({
  executivos,
  associacoes,
  executivoIdSelecionado,
  associacaoIdSelecionado,
  executivoTravado,
  associacaoTravado,
  setExecutivoId,
}: Passo8ExecutivoAssociacaoProps) {
  const executivoSelecionado =
    executivos.find((item) => item.id === executivoIdSelecionado) ?? null;
  const associacaoSelecionada =
    associacoes.find((item) => item.id === associacaoIdSelecionado) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-foreground text-sm font-bold">Executivo</label>
        {executivoTravado ? (
          <>
            <div className="border-input bg-muted text-muted-foreground flex cursor-not-allowed items-center gap-2 rounded-full border px-4 py-2.5 text-sm">
              <Lock className="size-4 shrink-0" />
              {executivoSelecionado?.nome ?? "Executivo do link"}
            </div>
            <p className="text-muted-foreground text-xs">
              Esse campo veio preenchido pelo link usado pra acessar o cadastro e não pode ser
              alterado aqui.
            </p>
          </>
        ) : (
          <Combobox<ExecutivoOption>
            items={executivos}
            value={executivoSelecionado}
            onValueChange={(executivo) => setExecutivoId(executivo?.id ?? null)}
            itemToStringLabel={(executivo) => executivo.nome}
          >
            <ComboboxInputGroup>
              <ComboboxInput placeholder="Busque por nome (opcional)" autoComplete="off" />
            </ComboboxInputGroup>
            <ComboboxContent>
              {(executivo: ExecutivoOption) => (
                <ComboboxItem key={executivo.id} value={executivo}>
                  {executivo.nome}
                </ComboboxItem>
              )}
            </ComboboxContent>
          </Combobox>
        )}
      </div>

      {/* Associação só aparece quando vem travada pelo link (?associacao= na
          URL) — sem isso, o campo fica oculto por completo, sem opção de
          seleção manual (pedido do usuário, 2026-07-29). */}
      {associacaoTravado && (
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-bold">Associação</label>
          <div className="border-input bg-muted text-muted-foreground flex cursor-not-allowed items-center gap-2 rounded-full border px-4 py-2.5 text-sm">
            <Lock className="size-4 shrink-0" />
            {associacaoSelecionada?.nome ?? "Associação do link"}
          </div>
          <p className="text-muted-foreground text-xs">
            Esse campo veio preenchido pelo link usado pra acessar o cadastro e não pode ser
            alterado aqui.
          </p>
        </div>
      )}
    </div>
  );
}
