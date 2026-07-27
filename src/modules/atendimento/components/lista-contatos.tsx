"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { ContatoAgencia, NumeroContato } from "@/modules/atendimento/types/atendimento.types";

interface ListaContatosProps {
  contatos: ContatoAgencia[];
  busca: string;
  carregando: boolean;
  onBuscar: (busca: string) => void;
  onEscolherNumero: (numero: NumeroContato) => void;
}

// Coluna 1, aba "Contatos" — diferente de ListaConversas: mostra TODAS as
// agências (tenham conversa iniciada ou não), ordenadas por nome (a
// ordenação já vem do backend). Clicar no nome só expande quando há mais
// de 1 número — com 1 só, já escolhe direto (mesmo critério do modal).
export function ListaContatos({
  contatos,
  busca,
  carregando,
  onBuscar,
  onEscolherNumero,
}: ListaContatosProps) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  function alternarExpandido(agenciaId: string) {
    setExpandidos((atual) => {
      const novo = new Set(atual);
      if (novo.has(agenciaId)) {
        novo.delete(agenciaId);
      } else {
        novo.add(agenciaId);
      }
      return novo;
    });
  }

  function clicarAgencia(contato: ContatoAgencia) {
    const [unico] = contato.numeros;
    if (contato.numeros.length <= 1) {
      if (unico) onEscolherNumero(unico);
      return;
    }
    alternarExpandido(contato.agenciaId);
  }

  return (
    <div className="border-border bg-card flex h-full w-full min-w-0 flex-col border-r">
      <div className="border-border border-b p-3">
        <div className="border-input bg-background flex items-center gap-2 rounded-full border px-3 py-2">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={(event) => onBuscar(event.target.value)}
            placeholder="Buscar por nome ou CNPJ"
            className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {carregando ? (
          <p className="text-muted-foreground p-4 text-center text-sm">Carregando contatos...</p>
        ) : contatos.length === 0 ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            Nenhuma agência encontrada.
          </p>
        ) : (
          contatos.map((contato) => {
            const expandido = expandidos.has(contato.agenciaId);
            const multiplos = contato.numeros.length > 1;

            return (
              <div key={contato.agenciaId} className="border-border border-b">
                <button
                  type="button"
                  onClick={() => clicarAgencia(contato)}
                  className="hover:bg-muted/40 flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">
                      {contato.agenciaNome}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {contato.numeros.length} número{contato.numeros.length === 1 ? "" : "s"} de
                      WhatsApp
                    </p>
                  </div>
                  {multiplos ? (
                    <ChevronDown
                      className={`text-muted-foreground size-4 shrink-0 transition-transform ${
                        expandido ? "rotate-180" : ""
                      }`}
                    />
                  ) : null}
                </button>

                {multiplos && expandido ? (
                  <div className="bg-muted/20 flex flex-col pb-1">
                    {contato.numeros.map((numero) => (
                      <button
                        key={`${numero.papel}-${numero.telefone}`}
                        type="button"
                        onClick={() => onEscolherNumero(numero)}
                        className="hover:bg-muted/50 flex items-center justify-between gap-2 px-6 py-2 text-left text-xs transition"
                      >
                        <span className="text-foreground font-medium">{numero.label}</span>
                        <span className="text-muted-foreground">{numero.telefone}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
