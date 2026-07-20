"use client";

import { useEffect, useState } from "react";
import type { DocumentoRevisao } from "@/modules/admin/types/dossie.types";

interface RevisaoDocumentosComplementarProps {
  agenciaId: string;
  // Já vêm separados de quem prepara os dados da página (page.tsx) — a
  // View só renderiza, não decide o que é "ativo" ou "pendente".
  documentosAtivos: DocumentoRevisao[];
  documentosPendentes: DocumentoRevisao[];
  aprovarDocumentoAction: (agenciaId: string, documentoId: string) => Promise<void>;
  reprovarDocumentoAction: (
    agenciaId: string,
    documentoId: string,
    formData: FormData,
  ) => Promise<void>;
  solicitarReenvioDocumentosAction: (agenciaId: string, formData: FormData) => Promise<void>;
}

const BOTAO_DECISAO =
  "rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

function CopiarLinkButton({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(link);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
      className="text-primary shrink-0 text-xs font-semibold hover:underline"
    >
      {copiado ? "Copiado!" : "Copiar link"}
    </button>
  );
}

// Revisão de documentos do cadastro em "em_complementar" — agora com
// dado real: aprovar/reprovar chamam server actions que gravam no
// Documento (ver ReprovarDocumentoUseCase/AprovarDocumentoUseCase).
// Reprovar é soft-delete: some do rol "ativo" aqui (e da ficha, ver
// CampoDocumento em page.tsx) sem apagar do banco — reaparece quando o
// cliente reenvia pela página pública (link mostrado embaixo).
export function RevisaoDocumentosComplementar({
  agenciaId,
  documentosAtivos,
  documentosPendentes,
  aprovarDocumentoAction,
  reprovarDocumentoAction,
  solicitarReenvioDocumentosAction,
}: RevisaoDocumentosComplementarProps) {
  const [reprovandoId, setReprovandoId] = useState<string | null>(null);
  // Calculado só depois de montar (client-only) — se calculasse direto no
  // corpo do componente, o servidor renderiza sem `window` (link relativo)
  // e o cliente hidrata com origin completo, gerando mismatch de
  // hidratação (React reclama porque o HTML final diverge do servidor).
  const [linkReenvio, setLinkReenvio] = useState<string | null>(null);

  useEffect(() => {
    setLinkReenvio(`${window.location.origin}/cadastro/documentos-pendentes/${agenciaId}`);
  }, [agenciaId]);

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
      <span className="text-primary text-xs font-bold tracking-wide uppercase">
        Revisão de documentos
      </span>

      <div className="flex flex-col gap-2">
        {documentosAtivos.map((doc) => (
          <div
            key={doc.id}
            className="border-border bg-muted/30 flex flex-col gap-2 rounded-xl border px-4 py-2.5 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground font-medium">{doc.label}</span>
                <a
                  href={`/api/painel/documentos/${doc.id}/arquivo`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs font-semibold hover:underline"
                >
                  Ver anexo
                </a>
                {doc.status === "APROVADO" ? (
                  <span className="bg-success/15 text-success rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
                    Aprovado
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={aprovarDocumentoAction.bind(null, agenciaId, doc.id)}>
                  <button
                    type="submit"
                    className={`${BOTAO_DECISAO} ${
                      doc.status === "APROVADO"
                        ? "border-success bg-success text-success-foreground"
                        : "border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    Aprovar
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setReprovandoId(reprovandoId === doc.id ? null : doc.id)}
                  className={`${BOTAO_DECISAO} border-input text-foreground hover:bg-accent`}
                >
                  Reprovar
                </button>
              </div>
            </div>

            {reprovandoId === doc.id ? (
              <form
                action={async (formData) => {
                  await reprovarDocumentoAction(agenciaId, doc.id, formData);
                  setReprovandoId(null);
                }}
                className="flex flex-col gap-2 border-t border-dashed pt-2"
              >
                <textarea
                  name="motivo"
                  required
                  rows={2}
                  placeholder="Motivo da reprovação (obrigatório — o cliente vê isso na página de reenvio)"
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="border-destructive bg-destructive text-destructive-foreground rounded-full border px-3 py-1 text-xs font-semibold transition"
                  >
                    Confirmar reprovação
                  </button>
                  <button
                    type="button"
                    onClick={() => setReprovandoId(null)}
                    className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1 text-xs font-medium transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ))}
      </div>

      {documentosPendentes.length > 0 ? (
        <div className="border-warning/30 bg-warning/5 flex flex-col gap-3 rounded-xl border p-4 text-sm">
          <span className="text-warning text-xs font-bold tracking-wide uppercase">
            Documentos pendentes de reenvio
          </span>

          <form
            action={solicitarReenvioDocumentosAction.bind(null, agenciaId)}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-2">
              {documentosPendentes.map((doc) => (
                <label key={doc.id} className="text-foreground flex items-start gap-2">
                  <input type="checkbox" name="documentoIds" value={doc.id} className="mt-0.5" />
                  <span>
                    {doc.label}
                    {doc.motivoReprovacao ? (
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {doc.motivoReprovacao}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-sakura-600 w-fit rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              Solicitar documentos por e-mail
            </button>
          </form>

          <div className="border-border bg-background flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <span className="text-muted-foreground shrink-0">Link pra o cliente reenviar:</span>
            <code className="text-foreground min-w-0 flex-1 break-all">
              {linkReenvio ?? "carregando..."}
            </code>
            {linkReenvio ? <CopiarLinkButton link={linkReenvio} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
