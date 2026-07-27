"use client";

import { useState, type MouseEvent } from "react";
import { TravelLinkModal } from "./travel-link-modal";
import { AlertaTravelLinkModal } from "./alerta-travel-link-modal";

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

function formatarDataHora(data: Date): string {
  return data.toLocaleString("pt-BR");
}

interface ValidacaoSicaTravelLinkProps {
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
  sicaCodigo: string | null;
  sicaSalvoPor: string | null;
  sicaSalvoEm: Date | null;
  travelLinkCriado: boolean;
  travelLinkSalvoPor: string | null;
  travelLinkSalvoEm: Date | null;
  salvarSicaAction: (agenciaId: string, formData: FormData) => Promise<void>;
  salvarTravelLinkAction: (agenciaId: string, criado: boolean) => Promise<void>;
  validarContratoAction: (id: string) => Promise<void>;
  recusarCadastroAction: (id: string) => Promise<void>;
  // true quando o analista está revendo esta etapa a partir de uma etapa
  // posterior (ver `etapaExibida` na page) — some com os botões de ação,
  // só sobra a leitura do que foi preenchido.
  somenteLeitura?: boolean;
}

// SICA e Travel Link salvos de verdade em Agencia (sicaCodigo/
// sicaSalvoPor/sicaSalvoEm, travelLinkCriado/travelLinkSalvoPor/
// travelLinkSalvoEm) — sobrevivem a recarregar a página e ficam visíveis
// pra qualquer analista que abrir o dossiê depois, com quem confirmou e
// quando.
export function ValidacaoSicaTravelLink({
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
  sicaCodigo,
  sicaSalvoPor,
  sicaSalvoEm,
  travelLinkCriado,
  travelLinkSalvoPor,
  travelLinkSalvoEm,
  salvarSicaAction,
  salvarTravelLinkAction,
  validarContratoAction,
  recusarCadastroAction,
  somenteLeitura = false,
}: ValidacaoSicaTravelLinkProps) {
  const [editandoSica, setEditandoSica] = useState(false);
  const [rascunhoSica, setRascunhoSica] = useState(sicaCodigo ?? "");
  const [salvandoSica, setSalvandoSica] = useState(false);
  const [alertaTravelLinkAberto, setAlertaTravelLinkAberto] = useState(false);

  const sicaPronta = sicaCodigo !== null;
  const mostrarInputSica = editandoSica || sicaCodigo === null;

  // SICA pronto mas Travel Link ainda não criado: em vez de só desabilitar
  // o botão (fácil de ignorar), avisa com um alerta que some sozinho em
  // 5s (decisão do usuário, 2026-07-27) — deixa o botão clicável pra dar
  // pra mostrar o alerta.
  function handleClickValidar(event: MouseEvent<HTMLButtonElement>) {
    if (sicaPronta && !travelLinkCriado) {
      event.preventDefault();
      setAlertaTravelLinkAberto(true);
    }
  }

  async function handleSalvarSica(formData: FormData) {
    setSalvandoSica(true);
    await salvarSicaAction(agenciaId, formData);
    setSalvandoSica(false);
    setEditandoSica(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sica" className="text-foreground text-sm font-bold">
          Código SICA
        </label>

        {mostrarInputSica ? (
          <form action={handleSalvarSica} className="flex gap-2">
            <input
              id="sica"
              name="codigo"
              type="text"
              inputMode="numeric"
              value={rascunhoSica}
              disabled={somenteLeitura || salvandoSica}
              onChange={(event) => setRascunhoSica(event.target.value.replace(/\D/g, ""))}
              placeholder="Somente números"
              className={`${INPUT_CLASSNAME} min-w-0 flex-1`}
            />
            <button
              type="submit"
              disabled={rascunhoSica.length === 0 || somenteLeitura || salvandoSica}
              className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvandoSica ? "Salvando..." : "Salvar"}
            </button>
            {sicaCodigo !== null ? (
              <button
                type="button"
                onClick={() => {
                  setRascunhoSica(sicaCodigo);
                  setEditandoSica(false);
                }}
                className="border-input text-foreground hover:bg-accent shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition"
              >
                Cancelar
              </button>
            ) : null}
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-success/15 text-success rounded-full px-3 py-1.5 font-mono text-sm font-bold">
              {sicaCodigo}
            </span>
            {!somenteLeitura ? (
              <button
                type="button"
                onClick={() => setEditandoSica(true)}
                className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1 text-xs font-medium transition"
              >
                Editar
              </button>
            ) : null}
          </div>
        )}

        {sicaCodigo !== null && sicaSalvoPor && sicaSalvoEm ? (
          <span className="text-success text-xs font-medium">
            ✓ Salvo por {sicaSalvoPor} em {formatarDataHora(sicaSalvoEm)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-foreground text-sm font-bold">Travel Link</span>
        <TravelLinkModal
          agenciaId={agenciaId}
          razaoSocial={razaoSocial}
          cnpj={cnpj}
          enderecoFormatado={enderecoFormatado}
          telefoneContato={telefoneContato}
          telefoneComercial={telefoneComercial}
          associacaoNome={associacaoNome}
          promotorNome={promotorNome}
          nomeContato={nomeContato}
          emailContato={emailContato}
          bancoLabel={bancoLabel}
          bancoAgencia={bancoAgencia}
          bancoConta={bancoConta}
          favorecidoNome={favorecidoNome}
          favorecidoDoc={favorecidoDoc}
          travelLinkCriado={travelLinkCriado}
          travelLinkSalvoPor={travelLinkSalvoPor}
          travelLinkSalvoEm={travelLinkSalvoEm}
          salvarTravelLinkAction={salvarTravelLinkAction}
          somenteLeitura={somenteLeitura}
          onFechar={() => {
            if (!travelLinkCriado) setAlertaTravelLinkAberto(true);
          }}
        />
      </div>

      {!somenteLeitura ? (
        <div className="flex flex-wrap gap-2">
          <form action={validarContratoAction.bind(null, agenciaId)}>
            <button
              type="submit"
              disabled={!sicaPronta}
              onClick={handleClickValidar}
              title={!sicaPronta ? "Salve o código SICA antes de validar" : undefined}
              className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Validar Contrato
            </button>
          </form>
          <form action={recusarCadastroAction.bind(null, agenciaId)}>
            <button
              type="submit"
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50"
            >
              Recusar
            </button>
          </form>
        </div>
      ) : null}

      <AlertaTravelLinkModal
        aberto={alertaTravelLinkAberto}
        onFechar={() => setAlertaTravelLinkAberto(false)}
      />
    </div>
  );
}
