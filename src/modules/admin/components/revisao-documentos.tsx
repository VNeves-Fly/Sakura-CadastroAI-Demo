"use client";

import { useEffect, useState } from "react";
import type { DocumentoRevisao } from "@/modules/admin/types/dossie.types";
import { HistoricoDocumento } from "@/modules/admin/components/dossie-campos";

interface RevisaoDocumentosComplementarProps {
  agenciaId: string;
  // Já vêm separados de quem prepara os dados da página (page.tsx) — a
  // View só renderiza, não decide o que é "pendente".
  documentosPendentes: DocumentoRevisao[];
  solicitarReenvioDocumentosAction: (agenciaId: string, formData: FormData) => Promise<void>;
  // true quando o analista está revendo esta etapa a partir de uma etapa
  // posterior (ver `etapaExibida` na page) — trava solicitar reenvio, só
  // sobra a leitura (ver histórico/copiar link).
  somenteLeitura?: boolean;
}

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

// Painel de reenvio de documentos reprovados — o ver/aprovar/reprovar dos
// documentos "ativos" agora vive embutido onde cada documento normalmente
// aparece na ficha (Empresa/Sócios, ver CampoDocumento em page.tsx e
// Arquivo/AcoesAprovacaoDocumento em dossie-campos.tsx), então não duplica
// mais a lista aqui (decisão do usuário, 2026-07-26: centralizar num modal
// só). Sobra só a capacidade que não existe em nenhum outro lugar: pedir
// reenvio de quem está REPROVADO (por e-mail, ou copiando o link).
export function RevisaoDocumentosComplementar({
  agenciaId,
  documentosPendentes,
  solicitarReenvioDocumentosAction,
  somenteLeitura = false,
}: RevisaoDocumentosComplementarProps) {
  // Calculado só depois de montar (client-only) — se calculasse direto no
  // corpo do componente, o servidor renderiza sem `window` (link relativo)
  // e o cliente hidrata com origin completo, gerando mismatch de
  // hidratação (React reclama porque o HTML final diverge do servidor).
  const [linkReenvio, setLinkReenvio] = useState<string | null>(null);

  useEffect(() => {
    setLinkReenvio(`${window.location.origin}/cadastro/documentos-pendentes/${agenciaId}`);
  }, [agenciaId]);

  if (documentosPendentes.length === 0) return null;

  return (
    <div className="border-warning/30 bg-warning/5 flex flex-col gap-3 rounded-xl border p-4 text-sm">
      <span className="text-warning text-xs font-bold tracking-wide uppercase">
        Documentos pendentes de reenvio
      </span>

      {somenteLeitura ? (
        <div className="flex flex-col gap-2">
          {documentosPendentes.map((doc) => (
            <div key={doc.id} className="flex flex-col gap-1.5">
              <span className="text-foreground">
                {doc.label}
                {doc.motivoReprovacao ? (
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {doc.motivoReprovacao}
                  </span>
                ) : null}
              </span>
              <HistoricoDocumento historico={doc.historico} />
            </div>
          ))}
        </div>
      ) : (
        <form
          action={solicitarReenvioDocumentosAction.bind(null, agenciaId)}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-2">
            {documentosPendentes.map((doc) => (
              <div key={doc.id} className="flex flex-col gap-1.5">
                <label className="text-foreground flex items-start gap-2">
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
                <HistoricoDocumento historico={doc.historico} />
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-sakura-600 w-fit rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            Solicitar documentos por e-mail
          </button>
        </form>
      )}

      <div className="border-border bg-background flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs">
        <span className="text-muted-foreground shrink-0">Link pra o cliente reenviar:</span>
        <code className="text-foreground min-w-0 flex-1 break-all">
          {linkReenvio ?? "carregando..."}
        </code>
        {linkReenvio ? <CopiarLinkButton link={linkReenvio} /> : null}
      </div>
    </div>
  );
}
