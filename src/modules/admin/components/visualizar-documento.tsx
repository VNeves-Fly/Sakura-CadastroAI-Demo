"use client";

import { useState, type ReactNode } from "react";
import { X, ExternalLink } from "lucide-react";

const EXTENSOES_IMAGEM = new Set(["jpg", "jpeg", "png"]);

function extensao(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

interface VisualizarDocumentoProps {
  documentoId: string;
  gcsPath: string;
  label: string;
  children: ReactNode;
  // Rodapé opcional do modal (ex: botões Aprovar/Reprovar) — força o
  // analista a abrir o documento antes de decidir, em vez de decidir
  // direto na linha da lista sem ver o arquivo.
  acoes?: ReactNode;
  // Painel de dados opcional (ex: <AnaliseIaDetalhe>, ver dossie-campos.tsx)
  // — quando presente, o modal vira duas colunas (dados à esquerda,
  // visualização à direita); ausente, mantém o layout de coluna única de
  // sempre. Slot genérico (igual `acoes`) pra este componente não precisar
  // conhecer o tipo de análise de IA — só layout.
  painelEsquerdo?: ReactNode;
}

// Botão + modal de pré-visualização — antes "Ver anexo" abria
// /api/cadastros/documentos/[id]/arquivo numa aba nova (o navegador só
// mostra o PDF/imagem cru, sem nada da tela do dossiê). A mesma rota
// (redirect signed-URL no GCS, ou buffer direto em disco local) funciona
// igual dentro de <iframe>/<img>, então a pré-visualização não precisa de
// nenhum endpoint novo.
export function VisualizarDocumento({
  documentoId,
  gcsPath,
  label,
  children,
  acoes,
  painelEsquerdo,
}: VisualizarDocumentoProps) {
  const [aberto, setAberto] = useState(false);
  const url = `/api/cadastros/documentos/${documentoId}/arquivo`;
  const ehImagem = EXTENSOES_IMAGEM.has(extensao(gcsPath));

  const visualizacao = (
    <div className="bg-muted/30 min-h-0 flex-1">
      {ehImagem ? (
        // eslint-disable-next-line @next/next/no-img-element -- vem de rota autenticada própria, não é otimizável pelo next/image
        <img src={url} alt={label} className="h-full w-full object-contain" />
      ) : (
        <iframe src={url} title={label} className="h-full w-full border-0" />
      )}
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="hover:underline">
        {children}
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className={`bg-card flex h-full max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl shadow-2xl ${
              painelEsquerdo ? "max-w-5xl" : "max-w-3xl"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
              <span className="text-foreground min-w-0 truncate text-sm font-semibold">
                {label}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1 text-xs font-semibold hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  Abrir em nova aba
                </a>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full p-1 transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {painelEsquerdo ? (
              <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                <div className="border-border max-h-[40vh] overflow-y-auto border-b p-4 md:max-h-none md:w-80 md:shrink-0 md:border-r md:border-b-0">
                  {painelEsquerdo}
                </div>
                {visualizacao}
              </div>
            ) : (
              visualizacao
            )}

            {acoes ? <div className="border-border bg-card border-t px-5 py-4">{acoes}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
