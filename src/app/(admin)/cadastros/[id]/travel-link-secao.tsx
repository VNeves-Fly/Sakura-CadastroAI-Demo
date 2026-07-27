"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";

// `data` chega como string (não Date) quando vem de uma entidade de
// domínio com toJSON — ver formatarData em dossie-campos.util.ts.
function formatarDataHora(data: Date | string): string {
  return (data instanceof Date ? data : new Date(data)).toLocaleString("pt-BR");
}

interface CampoTravelLink {
  label: string;
  valor: string | null;
}

function Bloco({ titulo, campos }: { titulo: string; campos: CampoTravelLink[] }) {
  const [campoCopiadoLabel, setCampoCopiadoLabel] = useState<string | null>(null);

  async function copiarCampo(campo: CampoTravelLink) {
    if (!campo.valor) return;
    await navigator.clipboard.writeText(campo.valor);
    setCampoCopiadoLabel(campo.label);
    setTimeout(() => setCampoCopiadoLabel((atual) => (atual === campo.label ? null : atual)), 1500);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
        {titulo}
      </span>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {campos.map((campo) => (
          <div key={campo.label} className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs">{campo.label}</dt>
              <dd className="text-foreground truncate text-sm font-medium">{campo.valor || "—"}</dd>
            </div>
            <button
              type="button"
              disabled={!campo.valor}
              onClick={() => void copiarCampo(campo)}
              aria-label={`Copiar ${campo.label}`}
              title={`Copiar ${campo.label}`}
              className="text-muted-foreground hover:text-foreground hover:bg-accent mt-0.5 shrink-0 rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {campoCopiadoLabel === campo.label ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface TravelLinkSecaoProps {
  agenciaId: string;
  razaoSocial: string;
  cnpj: string;
  enderecoFormatado: string;
  telefoneContato: string;
  telefoneComercial: string | null;
  associacaoNome: string | null;
  promotorNome: string | null;
  nomeContato: string | null;
  emailContato: string | null;
  bancoLabel: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  favorecidoNome: string | null;
  favorecidoDoc: string | null;
  travelLinkCriado: boolean;
  travelLinkSalvoPor: string | null;
  travelLinkSalvoEm: Date | null;
  salvarTravelLinkAction: (agenciaId: string, criado: boolean) => Promise<void>;
  somenteLeitura?: boolean;
}

// Acordeão inline (sem modal) — uma cópia dos dados já coletados na
// ficha, no formato que o Travel Link (plataforma externa, sem
// integração) pede, pra o analista usar de cola ao cadastrar manualmente
// por lá. A flag abaixo grava o mesmo Agencia.travelLinkCriado de sempre,
// só que salva direto ao ligar — decisão do usuário, 2026-07-27: reverter
// o intermediário de checkbox + botão Salvar (que existia antes disso),
// e nunca mais é possível desligar por aqui depois de criado.
export function TravelLinkSecao({
  agenciaId,
  razaoSocial,
  cnpj,
  enderecoFormatado,
  telefoneContato,
  telefoneComercial,
  associacaoNome,
  promotorNome,
  nomeContato,
  emailContato,
  bancoLabel,
  bancoAgencia,
  bancoConta,
  favorecidoNome,
  favorecidoDoc,
  travelLinkCriado,
  travelLinkSalvoPor,
  travelLinkSalvoEm,
  salvarTravelLinkAction,
  somenteLeitura = false,
}: TravelLinkSecaoProps) {
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const blocos: { titulo: string; campos: CampoTravelLink[] }[] = [
    {
      titulo: "Agência",
      campos: [
        { label: "Razão social", valor: razaoSocial },
        { label: "CNPJ", valor: cnpj },
        { label: "Endereço", valor: enderecoFormatado },
        { label: "Telefone", valor: telefoneContato },
        { label: "Telefone comercial", valor: telefoneComercial },
        { label: "Afiliado (Associação)", valor: associacaoNome },
        { label: "Promotor", valor: promotorNome },
      ],
    },
    {
      titulo: "Contato",
      campos: [
        { label: "Nome de contato", valor: nomeContato },
        { label: "E-mail", valor: emailContato },
      ],
    },
    {
      titulo: "Bancário",
      campos: [
        { label: "Banco", valor: bancoLabel },
        { label: "Número da agência", valor: bancoAgencia },
        { label: "Número da conta", valor: bancoConta },
        { label: "Nome do titular", valor: favorecidoNome },
        { label: "CNPJ/CPF do favorecido", valor: favorecidoDoc },
      ],
    },
  ];

  async function copiarTudo() {
    const texto = blocos
      .flatMap((bloco) => [
        `${bloco.titulo}:`,
        ...bloco.campos.map((campo) => `${campo.label}: ${campo.valor || "—"}`),
        "",
      ])
      .join("\n");
    await navigator.clipboard.writeText(texto.trim());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function ativarFlag() {
    setSalvando(true);
    await salvarTravelLinkAction(agenciaId, true);
    setSalvando(false);
  }

  return (
    <SecaoColapsavel
      titulo="Travel Link"
      icon={<LinkIcon className="size-4" />}
      defaultAberta={false}
    >
      <div className="flex flex-col gap-4">
        {blocos.map((bloco) => (
          <Bloco key={bloco.titulo} titulo={bloco.titulo} campos={bloco.campos} />
        ))}

        <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
          <strong className="text-foreground">Valores padrão no Travel Link</strong> (não vêm da
          ficha, é só pra lembrar): Bloqueado = S, Tipo de pagamento = PIX.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void copiarTudo()}
            className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
          >
            {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copiado ? "Copiado!" : "Copiar tudo"}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">Travel Link criado</span>
            <button
              type="button"
              role="switch"
              aria-checked={travelLinkCriado}
              disabled={somenteLeitura || salvando || travelLinkCriado}
              onClick={() => void ativarFlag()}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed",
                travelLinkCriado ? "bg-success" : "bg-input",
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 rounded-full bg-white shadow transition-transform",
                  travelLinkCriado ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>

        {travelLinkCriado && travelLinkSalvoPor && travelLinkSalvoEm ? (
          <span className="text-success text-xs font-medium">
            ✓ Confirmado por {travelLinkSalvoPor} em {formatarDataHora(travelLinkSalvoEm)}
          </span>
        ) : null}
      </div>
    </SecaoColapsavel>
  );
}
