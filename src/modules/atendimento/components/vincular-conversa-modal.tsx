"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Search, X } from "lucide-react";
import type {
  ContatoAgencia,
  NumeroContato,
  PapelMembro,
  VincularConversaAgenciaInput,
} from "@/modules/atendimento/types/atendimento.types";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";

const LABEL_PAPEL: Record<PapelMembro, string> = {
  socio: "Sócio",
  representante_legal: "Representante legal",
  comercial: "Comercial",
  outro: "Outro",
};

// Espera o analista parar de digitar antes de bater na API — mesma busca
// usada na aba Contatos (ListaContatos), só que sem estado compartilhado
// com o resto da tela (é local ao modal).
const DEBOUNCE_BUSCA_MS = 300;

interface VincularConversaModalProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (input: VincularConversaAgenciaInput) => Promise<void>;
}

// Liga uma conversa "não identificada" (número que não bateu com nenhum
// telefone cadastrado, ver WhatsAppContactMatcher) a uma agência escolhida
// manualmente pelo analista — 2 passos: busca a agência, depois escolhe
// qual membro dela é o dono desse número (ou registra como "Outro" quando
// não é ninguém da lista, ex: um assistente ligando pela empresa).
export function VincularConversaModal({
  aberto,
  onFechar,
  onConfirmar,
}: VincularConversaModalProps) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ContatoAgencia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [agenciaEscolhida, setAgenciaEscolhida] = useState<ContatoAgencia | null>(null);
  const [nomeOutro, setNomeOutro] = useState("");
  const [papelOutro, setPapelOutro] = useState<PapelMembro>("outro");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function resetar() {
    setBusca("");
    setResultados([]);
    setAgenciaEscolhida(null);
    setNomeOutro("");
    setPapelOutro("outro");
    setErro(null);
  }

  useEffect(() => {
    if (!aberto) resetar();
  }, [aberto]);

  useEffect(() => {
    if (!aberto || agenciaEscolhida) return;
    setBuscando(true);
    const timeout = setTimeout(() => {
      atendimentoApi
        .listarContatos(busca || undefined)
        .then(setResultados)
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    }, DEBOUNCE_BUSCA_MS);
    return () => clearTimeout(timeout);
  }, [aberto, busca, agenciaEscolhida]);

  if (!aberto) return null;

  async function confirmarMembro(numero: NumeroContato) {
    if (!agenciaEscolhida) return;
    setEnviando(true);
    setErro(null);
    try {
      await onConfirmar({
        agenciaId: agenciaEscolhida.agenciaId,
        representanteLegalId: numero.representanteLegalId,
        membroNome: numero.label,
        membroPapel: numero.papel,
      });
      onFechar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível vincular a conversa.");
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarOutro() {
    if (!agenciaEscolhida || !nomeOutro.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await onConfirmar({
        agenciaId: agenciaEscolhida.agenciaId,
        representanteLegalId: null,
        membroNome: nomeOutro.trim(),
        membroPapel: papelOutro,
      });
      onFechar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível vincular a conversa.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onFechar}
    >
      <div
        className="bg-card flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {agenciaEscolhida ? (
              <button
                type="button"
                onClick={() => setAgenciaEscolhida(null)}
                aria-label="Voltar pra busca"
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : null}
            <span className="text-foreground min-w-0 truncate text-sm font-semibold">
              {agenciaEscolhida
                ? `Quem é ${agenciaEscolhida.agenciaNome}?`
                : "Vincular a um cadastro"}
            </span>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {!agenciaEscolhida ? (
          <>
            <div className="border-border border-b p-3">
              <div className="border-input bg-background flex items-center gap-2 rounded-full border px-3 py-2">
                <Search className="text-muted-foreground size-4 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por nome ou CNPJ"
                  className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div className="max-h-80 min-h-0 overflow-y-auto p-2">
              {buscando ? (
                <p className="text-muted-foreground p-3 text-center text-sm">Buscando...</p>
              ) : resultados.length === 0 ? (
                <p className="text-muted-foreground p-3 text-center text-sm">
                  Nenhuma agência encontrada.
                </p>
              ) : (
                resultados.map((contato) => (
                  <button
                    key={contato.agenciaId}
                    type="button"
                    onClick={() => setAgenciaEscolhida(contato)}
                    className="hover:bg-accent flex w-full flex-col rounded-xl px-3 py-2 text-left transition"
                  >
                    <span className="text-foreground text-sm font-medium">
                      {contato.agenciaNome}
                    </span>
                    <span className="text-muted-foreground text-xs">{contato.cnpj}</span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            <p className="text-muted-foreground text-xs">
              Escolha quem é o dono deste número — se não for ninguém da lista, registre como
              &ldquo;Outro&rdquo; abaixo.
            </p>

            <div className="flex flex-col gap-1">
              {agenciaEscolhida.numeros.map((numero) => (
                <button
                  key={`${numero.papel}-${numero.telefone}`}
                  type="button"
                  disabled={enviando}
                  onClick={() => void confirmarMembro(numero)}
                  className="border-border hover:bg-accent flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition disabled:opacity-60"
                >
                  <span className="text-foreground font-medium">{numero.label}</span>
                  <span className="text-muted-foreground text-xs">{LABEL_PAPEL[numero.papel]}</span>
                </button>
              ))}
            </div>

            <div className="border-border flex flex-col gap-2 border-t pt-3">
              <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                Outro contato
              </span>
              <input
                type="text"
                value={nomeOutro}
                onChange={(event) => setNomeOutro(event.target.value)}
                placeholder="Nome de quem está falando"
                className="border-input bg-background text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
              />
              <select
                value={papelOutro}
                onChange={(event) => setPapelOutro(event.target.value as PapelMembro)}
                className="border-input bg-background text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
              >
                {(Object.keys(LABEL_PAPEL) as PapelMembro[]).map((papel) => (
                  <option key={papel} value={papel}>
                    {LABEL_PAPEL[papel]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={enviando || !nomeOutro.trim()}
                onClick={() => void confirmarOutro()}
                className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vincular como &ldquo;Outro&rdquo;
              </button>
            </div>

            {erro ? <p className="text-destructive text-xs">{erro}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
