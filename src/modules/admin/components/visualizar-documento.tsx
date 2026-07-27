"use client";

import { useState, type ReactNode } from "react";
import { X, ExternalLink } from "lucide-react";

const EXTENSOES_IMAGEM = new Set(["jpg", "jpeg", "png"]);

function extensao(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

interface VisualizarDocumentoBaseProps {
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
  // Banner opcional logo abaixo do cabeçalho (ex: <AuditoriaDocumento>,
  // ver dossie-campos.tsx) — quem/quando/por quê o documento foi
  // aprovado/reprovado. Sempre visível, independente do modal ter
  // `painelEsquerdo` (1 ou 2 colunas) ou não — auditoria não é um dado de
  // análise, é do próprio documento.
  infoAuditoria?: ReactNode;
  // Decisão atual do documento — tinta cabeçalho e rodapé do modal por
  // completo (verde/vermelho sistêmico), não só os botões dentro de
  // `acoes` (ver AcoesAprovacaoDocumento) — decisão do usuário,
  // 2026-07-27: o veredito precisa ficar óbvio no modal inteiro, não só
  // numa caixinha no rodapé. `undefined`/"PENDENTE" mantém o visual
  // neutro de sempre.
  statusDecisao?: "PENDENTE" | "APROVADO" | "REPROVADO";
}

// Duas formas de apontar a visualização: um `Documento` do banco (deriva
// a rota padrão de arquivo a partir do id, e decide imagem-vs-iframe pela
// extensão do gcsPath) ou uma `url` explícita já pronta (ex.: contrato do
// D4Sign, que não é um Documento — sempre iframe/PDF, sem extensão pra
// checar).
type VisualizarDocumentoProps = VisualizarDocumentoBaseProps &
  (
    | { documentoId: string; gcsPath: string; url?: never }
    | { documentoId?: never; gcsPath?: never; url: string }
  );
const CLASSES_HEADER_DECISAO: Record<string, string> = {
  APROVADO: "bg-success text-success-foreground",
  REPROVADO: "bg-destructive text-destructive-foreground",
};

const CLASSES_FOOTER_DECISAO: Record<string, string> = {
  APROVADO: "bg-success",
  REPROVADO: "bg-destructive",
};

// Botão + modal de pré-visualização — antes "Ver anexo" abria
// /api/cadastros/documentos/[id]/arquivo numa aba nova (o navegador só
// mostra o PDF/imagem cru, sem nada da tela do dossiê). A mesma rota
// (redirect signed-URL no GCS, ou buffer direto em disco local) funciona
// igual dentro de <iframe>/<img>, então a pré-visualização não precisa de
// nenhum endpoint novo.
export function VisualizarDocumento({
  label,
  children,
  acoes,
  painelEsquerdo,
  infoAuditoria,
  statusDecisao,
}: VisualizarDocumentoProps) {
  const [aberto, setAberto] = useState(false);
  const url = `/api/cadastros/documentos/${documentoId}/arquivo`;
  const ehImagem = EXTENSOES_IMAGEM.has(extensao(gcsPath));
  const classesHeader = statusDecisao ? CLASSES_HEADER_DECISAO[statusDecisao] : undefined;
  const classesFooter = statusDecisao ? CLASSES_FOOTER_DECISAO[statusDecisao] : undefined;

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
            <div
              className={`flex items-center justify-between gap-2 border-b px-5 py-3 ${
                classesHeader ? `${classesHeader} border-white/20` : "border-border"
              }`}
            >
              <span
                className={`min-w-0 truncate text-sm font-semibold ${
                  classesHeader ? "" : "text-foreground"
                }`}
              >
                {label}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 text-xs font-semibold hover:underline ${
                    classesHeader ? "" : "text-primary"
                  }`}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir em nova aba
                </a>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className={`rounded-full p-1 transition ${
                    classesHeader
                      ? "hover:bg-black/10"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {infoAuditoria ? (
              <div className="border-border bg-muted/30 border-b px-5 py-3">{infoAuditoria}</div>
            ) : null}

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

            {acoes ? (
              <div
                className={`border-t px-5 py-4 ${
                  classesFooter ? `${classesFooter} border-white/20` : "border-border bg-card"
                }`}
              >
                {acoes}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
