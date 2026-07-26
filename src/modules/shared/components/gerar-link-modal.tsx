"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, ExternalLink } from "lucide-react";
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
} from "@/components/ui/combobox";
import { montarUrlCadastroPersonalizado } from "@/modules/shared/utils/link-cadastro-personalizado.util";

interface OpcaoComNome {
  id: string;
  nome: string;
}

interface GerarLinkModalProps {
  titulo: string;
  descricao?: string;
  executivos: OpcaoComNome[];
  associacoes: OpcaoComNome[];
  // Presente (vindo de um Evento) trava o link nesse evento — o admin só
  // escolhe executivo/associação por cima. Ausente = cadastro básico, sem
  // nenhum evento na URL.
  eventoSlug?: string | null;
  onFechar: () => void;
}

// Gera o link personalizado do cadastro público (executivo e/ou associação,
// com ou sem evento) inteiramente client-side — nada é salvo no banco, os 3
// ids/slug possíveis já existem e são gerenciados em outro lugar (Promotor,
// Associacao, Evento). Reaproveitado tanto por Eventos (evento travado)
// quanto por Atribuições (cadastro básico, sem evento).
export function GerarLinkModal({
  titulo,
  descricao,
  executivos,
  associacoes,
  eventoSlug,
  onFechar,
}: GerarLinkModalProps) {
  const [executivoSelecionado, setExecutivoSelecionado] = useState<OpcaoComNome | null>(null);
  const [associacaoSelecionada, setAssociacaoSelecionada] = useState<OpcaoComNome | null>(null);
  const [copiado, setCopiado] = useState(false);

  const url = useMemo(
    () =>
      montarUrlCadastroPersonalizado({
        eventoSlug,
        executivoId: executivoSelecionado?.id ?? null,
        associacaoId: associacaoSelecionada?.id ?? null,
      }),
    [eventoSlug, executivoSelecionado, associacaoSelecionada],
  );

  async function copiarUrl() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function abrirPreview() {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
      onClick={onFechar}
    >
      <div
        className="border-border bg-card flex w-full max-w-md flex-col gap-4 rounded-3xl border p-6 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-base font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full p-1 transition"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <p className="text-muted-foreground text-sm">
          {descricao ??
            "Escolha um executivo e/ou uma associação — quem abrir esse link já chega com o campo correspondente preenchido e travado no cadastro."}
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">Executivo</label>
          <Combobox<OpcaoComNome>
            items={executivos}
            value={executivoSelecionado}
            onValueChange={setExecutivoSelecionado}
            itemToStringLabel={(executivo) => executivo.nome}
          >
            <ComboboxInputGroup>
              <ComboboxInput placeholder="Busque por nome (opcional)" autoComplete="off" />
            </ComboboxInputGroup>
            <ComboboxContent>
              {(executivo: OpcaoComNome) => (
                <ComboboxItem key={executivo.id} value={executivo}>
                  {executivo.nome}
                </ComboboxItem>
              )}
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">Associação</label>
          <Combobox<OpcaoComNome>
            items={associacoes}
            value={associacaoSelecionada}
            onValueChange={setAssociacaoSelecionada}
            itemToStringLabel={(associacao) => associacao.nome}
          >
            <ComboboxInputGroup>
              <ComboboxInput placeholder="Busque por nome (opcional)" autoComplete="off" />
            </ComboboxInputGroup>
            <ComboboxContent>
              {(associacao: OpcaoComNome) => (
                <ComboboxItem key={associacao.id} value={associacao}>
                  {associacao.nome}
                </ComboboxItem>
              )}
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="border-border bg-muted/30 flex flex-col gap-2 rounded-2xl border p-3">
          <p className="text-foreground truncate font-mono text-xs">{url}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copiarUrl}
              className="border-input text-foreground hover:bg-accent flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition"
            >
              {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiado ? "Copiado!" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={abrirPreview}
              className="border-input text-foreground hover:bg-accent flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition"
            >
              <ExternalLink className="size-3.5" />
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
