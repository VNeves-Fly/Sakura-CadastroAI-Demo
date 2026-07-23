"use client";

import { useRef, useState } from "react";
import {
  Play,
  Pause,
  FileText,
  Check,
  CheckCheck,
  ImageIcon,
  Download,
  X,
  Link2,
} from "lucide-react";
import type { Mensagem } from "@/modules/atendimento/types/atendimento.types";
import { formatarHorarioMensagem } from "@/modules/atendimento/utils/atendimento-formato.util";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";

const LABEL_TIPO_DOCUMENTO: Record<string, string> = {
  CONTRATO_SOCIAL: "Contrato Social",
  RG_CNPJ: "RG/CNH do sócio",
  PROCURACAO: "Procuração",
  CADASTUR: "Cadastur",
  COMPROVANTE_ENDERECO: "Comprovante de Endereço",
  COMPROVANTE_ENDERECO_AGENCIA: "Comprovante de Endereço da Agência",
  CERTIDAO_CASAMENTO: "Certidão de Casamento",
};

function urlMidia(midiaId: string): string {
  return `/api/atendimento/midia/${midiaId}`;
}

// Selo de status estilo WhatsApp — só faz sentido em mensagens enviadas
// pelo analista (a "leitura" é do lado do cliente). Como não existe
// webhook real de confirmação de leitura ainda (ver
// atendimento.store.ts), toda mensagem enviada fica só "entregue" (1
// check) — nunca simula um "lido" (2 checks azuis) que não aconteceu de
// verdade.
function SeloStatus({ lido }: { lido: boolean }) {
  return lido ? (
    <CheckCheck className="text-info size-3.5" />
  ) : (
    <Check className="text-muted-foreground/70 size-3.5" />
  );
}

function PlayerAudio({ mensagem }: { mensagem: Mensagem }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  if (!mensagem.midiaId) {
    return <p className="text-xs opacity-70">Áudio indisponível.</p>;
  }

  const url = urlMidia(mensagem.midiaId);

  function alternarPlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={url}
        preload="none"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => {
          setTocando(false);
          setProgresso(0);
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          if (audio.duration) setProgresso(audio.currentTime / audio.duration);
        }}
      />
      <button
        type="button"
        onClick={alternarPlay}
        aria-label={tocando ? "Pausar áudio" : "Tocar áudio"}
        className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full transition hover:opacity-80"
      >
        {tocando ? (
          <Pause className="size-4" fill="currentColor" />
        ) : (
          <Play className="size-4" fill="currentColor" />
        )}
      </button>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-current/20">
        <div
          className="h-full rounded-full bg-current transition-[width]"
          style={{ width: `${progresso * 100}%` }}
        />
      </div>
      <span className="text-xs opacity-80">
        {mensagem.duracaoSegundos ? `${mensagem.duracaoSegundos}s` : ""}
      </span>
      <a
        href={url}
        download
        aria-label="Baixar áudio"
        className="opacity-60 transition hover:opacity-100"
      >
        <Download className="size-3.5" />
      </a>
    </div>
  );
}

// Painel de "vincular ao cadastro" embutido no modal — só aparece se a
// conversa tem uma agência real por trás (agenciaId), já que "contato
// não identificado" não tem ficha nenhuma pra vincular (ver
// Conversa.agenciaId em atendimento.types.ts). Vincular = o analista já
// decidiu, olhando o arquivo, que ele é o documento certo — por isso cria
// o Documento já como aprovado, sem passar de novo pela fila de revisão
// (decisão do usuário, 2026-07-23).
function VincularDocumentoPainel({ agenciaId, midiaId }: { agenciaId: string; midiaId: string }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [pendentes, setPendentes] = useState<
    | Awaited<ReturnType<typeof atendimentoApi.listarDocumentosPendentes>>["documentosPendentes"]
    | null
  >(null);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function abrir() {
    setAberto(true);
    if (pendentes) return;
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await atendimentoApi.listarDocumentosPendentes(agenciaId);
      setPendentes(resultado.documentosPendentes);
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }

  async function confirmar() {
    if (!selecionadoId) return;
    setEnviando(true);
    setErro(null);
    try {
      await atendimentoApi.vincularMidiaComoDocumento(midiaId, {
        agenciaId,
        documentoId: selecionadoId,
      });
      setSucesso("Vinculado com sucesso — já sai da lista de pendências da ficha.");
      setPendentes((atual) => atual?.filter((item) => item.id !== selecionadoId) ?? null);
      setSelecionadoId(null);
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => void abrir()}
        className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
      >
        <Link2 className="size-4" />
        Vincular ao cadastro
      </button>
    );
  }

  return (
    <div className="flex w-72 flex-col gap-2 rounded-2xl bg-white p-4 text-left text-sm shadow-xl">
      <p className="text-foreground font-semibold">Vincular a um documento pendente</p>

      {carregando ? (
        <p className="text-muted-foreground text-xs">Carregando pendências...</p>
      ) : null}

      {pendentes && pendentes.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Nenhum documento pendente nesta agência no momento.
        </p>
      ) : null}

      {pendentes && pendentes.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {pendentes.map((documento) => (
            <label
              key={documento.id}
              className="border-input has-checked:border-primary has-checked:bg-primary/5 flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs"
            >
              <input
                type="radio"
                name="documento-pendente"
                checked={selecionadoId === documento.id}
                onChange={() => setSelecionadoId(documento.id)}
                className="accent-primary"
              />
              <span className="text-foreground font-medium">
                {LABEL_TIPO_DOCUMENTO[documento.tipo] ?? documento.tipo}
              </span>
              {documento.nomeSocio ? (
                <span className="text-muted-foreground">— {documento.nomeSocio}</span>
              ) : null}
            </label>
          ))}
        </div>
      ) : null}

      {erro ? <p className="text-destructive text-xs">{erro}</p> : null}
      {sucesso ? <p className="text-success text-xs">{sucesso}</p> : null}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          Fechar
        </button>
        {pendentes && pendentes.length > 0 ? (
          <button
            type="button"
            onClick={() => void confirmar()}
            disabled={!selecionadoId || enviando}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? "Vinculando..." : "Confirmar vínculo"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface ModalMidiaProps {
  tipo: "imagem" | "pdf";
  url: string;
  legenda: string;
  agenciaId: string | null;
  midiaId: string;
  onFechar: () => void;
}

// Modal único pra imagem e PDF — dentro do próprio chat (decisão do
// usuário, 2026-07-23: nada de abrir em nova aba). PDF usa <iframe> (todo
// navegador atual sabe renderizar PDF nativamente ali dentro).
function ModalMidia({ tipo, url, legenda, agenciaId, midiaId, onFechar }: ModalMidiaProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={legenda}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onFechar}
    >
      <div
        className={`flex max-h-full flex-col ${tipo === "pdf" ? "h-full w-full max-w-3xl" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        {tipo === "imagem" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={legenda}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        ) : (
          <iframe src={url} title={legenda} className="h-full w-full rounded-lg bg-white" />
        )}
      </div>

      <div
        className="absolute top-4 right-4 left-4 flex items-center justify-between gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          {agenciaId ? <VincularDocumentoPainel agenciaId={agenciaId} midiaId={midiaId} /> : null}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            <Download className="size-4" />
            Baixar
          </a>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ImagemMensagem({ mensagem, agenciaId }: { mensagem: Mensagem; agenciaId: string | null }) {
  const [aberta, setAberta] = useState(false);

  if (!mensagem.midiaId) {
    return (
      <div className="bg-muted/40 flex h-32 w-48 items-center justify-center rounded-lg">
        <ImageIcon className="text-muted-foreground size-8" />
      </div>
    );
  }

  const url = urlMidia(mensagem.midiaId);
  const legenda = mensagem.conteudo || "Imagem enviada";

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="block overflow-hidden rounded-lg"
        aria-label="Ver imagem em tamanho maior"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={legenda} className="h-32 w-48 object-cover" />
      </button>

      {aberta ? (
        <ModalMidia
          tipo="imagem"
          url={url}
          legenda={legenda}
          agenciaId={agenciaId}
          midiaId={mensagem.midiaId}
          onFechar={() => setAberta(false)}
        />
      ) : null}
    </>
  );
}

function PdfMensagem({ mensagem, agenciaId }: { mensagem: Mensagem; agenciaId: string | null }) {
  const [aberto, setAberto] = useState(false);

  const conteudo = (
    <>
      <FileText className="size-6 shrink-0 opacity-80" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{mensagem.conteudo}</span>
        {mensagem.tamanhoArquivo ? (
          <span className="text-xs opacity-70">{mensagem.tamanhoArquivo}</span>
        ) : null}
      </div>
    </>
  );

  if (!mensagem.midiaId) {
    return <div className="flex items-center gap-2">{conteudo}</div>;
  }

  const url = urlMidia(mensagem.midiaId);
  const legenda = mensagem.conteudo || "Documento enviado";

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 text-left underline-offset-2 hover:underline"
      >
        {conteudo}
      </button>

      {aberto ? (
        <ModalMidia
          tipo="pdf"
          url={url}
          legenda={legenda}
          agenciaId={agenciaId}
          midiaId={mensagem.midiaId}
          onFechar={() => setAberto(false)}
        />
      ) : null}
    </>
  );
}

function ConteudoMensagem({
  mensagem,
  agenciaId,
}: {
  mensagem: Mensagem;
  agenciaId: string | null;
}) {
  switch (mensagem.tipo) {
    case "audio":
      return <PlayerAudio mensagem={mensagem} />;
    case "imagem":
      return <ImagemMensagem mensagem={mensagem} agenciaId={agenciaId} />;
    case "pdf":
      return <PdfMensagem mensagem={mensagem} agenciaId={agenciaId} />;
    default:
      return <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>;
  }
}

export function MensagemBubble({
  mensagem,
  agenciaId,
}: {
  mensagem: Mensagem;
  agenciaId: string | null;
}) {
  const doAnalista = mensagem.autor === "analista";

  return (
    <div className={`flex ${doAnalista ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[70%] flex-col gap-1 rounded-2xl px-3 py-2 ${
          doAnalista
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border-border rounded-bl-sm border"
        }`}
      >
        {doAnalista && mensagem.analistaNome ? (
          <span className="text-[10px] font-bold tracking-wide uppercase opacity-80">
            {mensagem.analistaNome}
          </span>
        ) : null}
        <ConteudoMensagem mensagem={mensagem} agenciaId={agenciaId} />
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] opacity-70">
            {formatarHorarioMensagem(mensagem.createdAt)}
          </span>
          {doAnalista ? <SeloStatus lido={mensagem.lido} /> : null}
        </div>
      </div>
    </div>
  );
}
