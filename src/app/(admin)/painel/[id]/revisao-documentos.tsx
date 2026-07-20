"use client";

import { useState } from "react";

export interface DocumentoRevisao {
  id: string;
  label: string;
  path: string;
}

type Decisao = "pendente" | "aprovado" | "reprovado";

const BOTAO_DECISAO =
  "rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

// Revisão de documentos do cadastro em "em_complementar" — só a interface
// por enquanto (decisão do usuário, 2026-07-17): aprovar/reprovar
// documento e "solicitar reenvio por e-mail" ainda não têm use-case nem
// infra de e-mail no backend. As decisões aqui só vivem no estado local
// do componente (não persistem, resetam ao recarregar a página) — é uma
// prévia da interface, não a funcionalidade real.
export function RevisaoDocumentosComplementar({ documentos }: { documentos: DocumentoRevisao[] }) {
  const [decisoes, setDecisoes] = useState<Record<string, Decisao>>({});
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});

  function decidir(id: string, decisao: Decisao) {
    setDecisoes((atual) => ({ ...atual, [id]: decisao }));
    setSelecionados((atual) => {
      const entradas = Object.entries(atual).filter(([chave]) => chave !== id);
      if (decisao === "reprovado") {
        entradas.push([id, true]);
      }
      return Object.fromEntries(entradas);
    });
  }

  const reprovados = documentos.filter((doc) => decisoes[doc.id] === "reprovado");
  const algumSelecionado = reprovados.some((doc) => selecionados[doc.id]);

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
      <span className="text-primary text-xs font-bold tracking-wide uppercase">
        Revisão de documentos
      </span>

      <div className="flex flex-col gap-2">
        {documentos.map((doc) => {
          const decisao = decisoes[doc.id] ?? "pendente";
          return (
            <div
              key={doc.id}
              className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground font-medium">{doc.label}</span>
                <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-semibold break-all">
                  {doc.path.split("/").pop()}
                </span>
                {decisao === "aprovado" ? (
                  <span className="bg-success/15 text-success rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
                    Aprovado
                  </span>
                ) : null}
                {decisao === "reprovado" ? (
                  <span className="bg-destructive/15 text-destructive rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
                    Reprovado
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => decidir(doc.id, "aprovado")}
                  className={`${BOTAO_DECISAO} ${
                    decisao === "aprovado"
                      ? "border-success bg-success text-success-foreground"
                      : "border-input text-foreground hover:bg-accent"
                  }`}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => decidir(doc.id, "reprovado")}
                  className={`${BOTAO_DECISAO} ${
                    decisao === "reprovado"
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : "border-input text-foreground hover:bg-accent"
                  }`}
                >
                  Reprovar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {reprovados.length > 0 ? (
        <div className="border-warning/30 bg-warning/5 flex flex-col gap-3 rounded-xl border p-4 text-sm">
          <span className="text-warning text-xs font-bold tracking-wide uppercase">
            Documentos pendentes de reenvio
          </span>
          <div className="flex flex-col gap-1.5">
            {reprovados.map((doc) => (
              <label key={doc.id} className="text-foreground flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(selecionados[doc.id])}
                  onChange={(event) =>
                    setSelecionados((atual) => ({ ...atual, [doc.id]: event.target.checked }))
                  }
                />
                {doc.label}
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={!algumSelecionado}
            title="Aguardando use-case de reenvio + infra de e-mail no backend — ainda não envia nada de verdade"
            className="bg-primary text-primary-foreground hover:bg-sakura-600 w-fit rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Solicitar documentos por e-mail
          </button>
          <p className="text-muted-foreground text-xs">
            Essa tela ainda é só a interface — falta o use-case de reenvio, a página pública onde o
            cliente reenvia o documento, o disparo de e-mail e a reanálise da IA no backend. Nada
            aqui é salvo ainda (as decisões somem se recarregar a página).
          </p>
        </div>
      ) : null}
    </div>
  );
}
