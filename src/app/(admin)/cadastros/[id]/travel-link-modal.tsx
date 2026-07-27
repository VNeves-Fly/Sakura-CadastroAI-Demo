"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";

function formatarDataHora(data: Date): string {
  return data.toLocaleString("pt-BR");
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

interface TravelLinkModalProps {
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
  // Chamado ao fechar o modal pelo X ou clicando fora — pai usa isso pra
  // avisar se saiu sem confirmar (ver AlertaTravelLinkModal em
  // ValidacaoSicaTravelLink). Não dispara ao fechar depois de salvar.
  onFechar?: () => void;
}

// Formulário só de leitura — uma cópia dos dados já coletados na ficha,
// no formato que o Travel Link (plataforma externa, sem integração)
// pede, pra o analista usar de cola ao cadastrar manualmente por lá.
// Marcar "criado" aqui grava a mesma flag que antes era um switch solto
// (Agencia.travelLinkCriado) — decisão do usuário, 2026-07-27: dar
// substância real à flag em vez de deixar um toggle arbitrário.
export function TravelLinkModal({
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
  onFechar,
}: TravelLinkModalProps) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  function fechar() {
    setAberto(false);
    onFechar?.();
  }
  // Rascunho local do checkbox — só vira a flag de verdade ao clicar
  // "Salvar" (decisão do usuário, 2026-07-27: mais didático que um botão
  // que já salva sozinho). Resincroniza com o valor real sempre que o
  // modal abre, pra não carregar uma edição não salva de uma sessão
  // anterior.
  const [criadoRascunho, setCriadoRascunho] = useState(travelLinkCriado);

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

  async function handleSalvar() {
    setSalvando(true);
    await salvarTravelLinkAction(agenciaId, criadoRascunho);
    setSalvando(false);
    // Fecha direto (sem passar por `fechar()`/`onFechar`) — acabou de
    // confirmar, não faz sentido o alerta de "saiu sem confirmar" disparar
    // por causa do valor antigo de `travelLinkCriado` (só atualiza no
    // próximo render, depois do revalidatePath da Server Action).
    setAberto(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setCriadoRascunho(travelLinkCriado);
            setAberto(true);
          }}
          className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition"
        >
          {travelLinkCriado ? "Ver Travel Link" : "Criar Travel Link"}
        </button>
        {travelLinkCriado && travelLinkSalvoPor && travelLinkSalvoEm ? (
          <span className="text-success text-xs font-medium">
            ✓ Confirmado por {travelLinkSalvoPor} em {formatarDataHora(travelLinkSalvoEm)}
          </span>
        ) : null}
      </div>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={fechar}
        >
          <div
            className="bg-card flex h-full max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
              <span className="text-foreground text-sm font-semibold">Dados pro Travel Link</span>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full p-1 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
              {blocos.map((bloco) => (
                <Bloco key={bloco.titulo} titulo={bloco.titulo} campos={bloco.campos} />
              ))}

              <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
                <strong className="text-foreground">Valores padrão no Travel Link</strong> (não vêm
                da ficha, é só pra lembrar): Bloqueado = S, Tipo de pagamento = PIX.
              </div>

              {travelLinkCriado ? (
                <div className="border-border bg-success/10 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
                  <Check className="text-success size-4" />
                  <span className="text-foreground font-medium">Travel Link criado</span>
                </div>
              ) : (
                <label className="border-border flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={criadoRascunho}
                    disabled={somenteLeitura}
                    onChange={(event) => setCriadoRascunho(event.target.checked)}
                  />
                  <span className="text-foreground font-medium">Travel Link criado</span>
                </label>
              )}

              {travelLinkCriado && travelLinkSalvoPor && travelLinkSalvoEm ? (
                <span className="text-success text-xs font-medium">
                  ✓ Confirmado por {travelLinkSalvoPor} em {formatarDataHora(travelLinkSalvoEm)}
                </span>
              ) : null}
            </div>

            <div className="border-border bg-card flex flex-wrap items-center justify-between gap-2 border-t px-5 py-4">
              <button
                type="button"
                onClick={() => void copiarTudo()}
                className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
              >
                {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copiado ? "Copiado!" : "Copiar tudo"}
              </button>

              {/* Depois de criado, o modal vira só leitura — sem
                  checkbox/Salvar, decisão do usuário (2026-07-27): não
                  dá pra desmarcar por aqui mais. */}
              {!somenteLeitura && !travelLinkCriado ? (
                <button
                  type="button"
                  disabled={salvando || !criadoRascunho}
                  onClick={() => void handleSalvar()}
                  className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
