"use client";

import { useState, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { BotaoSubmitComLoading } from "./botao-submit-loading";
import { DadosEmpresaSecao } from "./dados-empresa-secao";
import { TravelLinkSwitch } from "./travel-link-switch";
import { AlertaTravelLinkModal } from "./alerta-travel-link-modal";
import {
  ConsultaAmatCard,
  ConsultaSofiaCard,
} from "@/modules/admin/components/consulta-amat-sofia";
import { ConsultaSicaCard } from "@/modules/admin/components/consulta-sica";
import type {
  AnaliseIaAmat,
  AnaliseIaRawToolCall,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type {
  HistoricoConsultaCreditoView,
  ConsultaSicaView,
} from "@/modules/admin/types/dossie.types";

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

// `data` chega como string (não Date) quando vem de uma entidade de
// domínio com toJSON — ver formatarData em dossie-campos.util.ts.
function formatarDataHora(data: Date | string): string {
  return (data instanceof Date ? data : new Date(data)).toLocaleString("pt-BR");
}

// Botão de submit dentro do <form action={atualizarSicaAction}> — mesmo
// motivo de BotaoReconsultar (consulta-amat-sofia.tsx) usar useFormStatus
// em vez de useState: só funciona lendo o form que o referencia.
function BotaoAtualizarSica() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCw className={pending ? "size-3 animate-spin" : "size-3"} />
      {pending ? "Atualizando..." : "Atualizar"}
    </button>
  );
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
  salvarSicaAction: (
    agenciaId: string,
    formData: FormData,
  ) => Promise<{ ok: true } | { ok: false; motivo: string }>;
  // Reconsulta o SST pelo código já salvo (metodo "codigo_empresa") — botão
  // "Atualizar" ao lado do código, ver AtualizarSicaUseCase. Diferente de
  // reconsultarSica (abaixo), que busca por CNPJ.
  atualizarSicaAction: () => Promise<void>;
  salvarTravelLinkAction: (agenciaId: string, criado: boolean) => Promise<void>;
  confirmarCadastramentoAction: (
    id: string,
  ) => Promise<{ ok: true } | { ok: false; motivo: string }>;
  // true quando o analista está revendo esta etapa a partir de uma etapa
  // posterior (ver `etapaExibida` na page) — some com os botões de ação,
  // só sobra a leitura do que foi preenchido.
  somenteLeitura?: boolean;
  // AMAT/SOFIA repetidos aqui (mesmos dados/ações da seção Complementar,
  // ver page.tsx) — decisão do usuário, 2026-07-27: o analista que já
  // está validando SICA/TravelLink não devia precisar voltar pra etapa
  // anterior só pra reconferir crédito.
  amat: AnaliseIaAmat | null;
  rawAmat: AnaliseIaRawToolCall[];
  historicoAmat: HistoricoConsultaCreditoView[];
  sofia: Record<string, unknown> | null;
  rawSofia: AnaliseIaRawToolCall[];
  historicoSofia: HistoricoConsultaCreditoView[];
  reconsultarAmat?: () => Promise<void>;
  reconsultarSofia?: () => Promise<void>;
  // Mesma checagem repetida aqui pelo mesmo motivo do AMAT/SOFIA acima —
  // é literalmente ao lado do campo de código SICA, o lugar mais relevante
  // pra essa informação.
  consultaSica: ConsultaSicaView;
  reconsultarSica?: () => Promise<void>;
}

// SICA e TravelLink salvos de verdade em Agencia (sicaCodigo/
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
  atualizarSicaAction,
  salvarTravelLinkAction,
  confirmarCadastramentoAction,
  somenteLeitura = false,
  amat,
  rawAmat,
  historicoAmat,
  sofia,
  rawSofia,
  historicoSofia,
  reconsultarAmat,
  reconsultarSofia,
  consultaSica,
  reconsultarSica,
}: ValidacaoSicaTravelLinkProps) {
  // Sugestão do SST (achada pela checagem automática por CNPJ, ver
  // AnalisarCadastroUseCase) — só serve pra pré-preencher o campo antes do
  // analista confirmar; nunca substitui a confirmação manual (o código só
  // vira `sicaCodigo` de verdade depois que o analista clica em "Salvar",
  // passando pela mesma validação de sempre, ver SalvarSicaUseCase).
  const codigoSugeridoSst =
    consultaSica.atual?.encontrado && consultaSica.atual.codigoEmpresa
      ? String(consultaSica.atual.codigoEmpresa)
      : null;

  const [editandoSica, setEditandoSica] = useState(false);
  const [rascunhoSica, setRascunhoSica] = useState(sicaCodigo ?? codigoSugeridoSst ?? "");
  const [salvandoSica, setSalvandoSica] = useState(false);
  const [erroSica, setErroSica] = useState<string | null>(null);
  const [erroConfirmar, setErroConfirmar] = useState<string | null>(null);
  const [alertaTravelLinkAberto, setAlertaTravelLinkAberto] = useState(false);

  const codigoSalvo = sicaCodigo !== null;
  // "Ativo no SICA" vem da consulta mais recente ao SST (qualquer método,
  // ver ConsultaSicaView) — não só ter um código salvo, mas confirmar que
  // ele está ativo de verdade (decisão do usuário, 2026-08-05: SICA/TL ->
  // Ativação exige os dois). Mesma checagem que ConfirmarCadastramentoUseCase
  // faz de novo no backend (trava real, não só esse disabled).
  const sicaAtivaNoSst =
    consultaSica.atual?.encontrado === true && consultaSica.atual.empresaStatus === "ativo";
  const sicaPronta = codigoSalvo && sicaAtivaNoSst;
  const mostrarInputSica = editandoSica || sicaCodigo === null;

  // SICA pronto mas TravelLink ainda não criado: em vez de só desabilitar
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
    setErroSica(null);
    const resultado = await salvarSicaAction(agenciaId, formData);
    setSalvandoSica(false);
    if (!resultado.ok) {
      setErroSica(resultado.motivo);
      return;
    }
    setEditandoSica(false);
  }

  async function handleConfirmarCadastramento() {
    setErroConfirmar(null);
    const resultado = await confirmarCadastramentoAction(agenciaId);
    if (!resultado.ok) {
      setErroConfirmar(resultado.motivo);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConsultaAmatCard
          amat={amat}
          rawAmat={rawAmat}
          historico={historicoAmat}
          reconsultar={somenteLeitura ? undefined : reconsultarAmat}
        />
        <ConsultaSofiaCard
          sofia={sofia}
          rawSofia={rawSofia}
          historico={historicoSofia}
          reconsultar={somenteLeitura ? undefined : reconsultarSofia}
        />
        <ConsultaSicaCard
          consulta={consultaSica}
          reconsultar={somenteLeitura ? undefined : reconsultarSica}
        />
      </div>

      <DadosEmpresaSecao
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
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sica" className="text-foreground text-sm font-bold">
          Código SICA
        </label>

        {sicaCodigo === null && codigoSugeridoSst ? (
          <p className="text-muted-foreground text-xs">
            Encontrado no SST — confira e clique em Salvar pra confirmar.
          </p>
        ) : null}

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
        ) : null}

        {erroSica ? <p className="text-destructive text-xs font-medium">{erroSica}</p> : null}

        {!mostrarInputSica ? (
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
            {!somenteLeitura ? (
              <form action={atualizarSicaAction} className="contents">
                <BotaoAtualizarSica />
              </form>
            ) : null}
          </div>
        ) : null}

        {sicaCodigo !== null && sicaSalvoPor && sicaSalvoEm ? (
          <span className="text-success text-xs font-medium">
            ✓ Salvo por {sicaSalvoPor} em {formatarDataHora(sicaSalvoEm)}
          </span>
        ) : null}
      </div>

      <TravelLinkSwitch
        agenciaId={agenciaId}
        travelLinkCriado={travelLinkCriado}
        travelLinkSalvoPor={travelLinkSalvoPor}
        travelLinkSalvoEm={travelLinkSalvoEm}
        salvarTravelLinkAction={salvarTravelLinkAction}
        somenteLeitura={somenteLeitura}
      />

      {!somenteLeitura ? (
        <div className="flex flex-wrap items-center gap-2">
          <form action={handleConfirmarCadastramento}>
            <BotaoSubmitComLoading
              labelCarregando="Confirmando..."
              disabled={!sicaPronta}
              onClick={handleClickValidar}
              title={
                !codigoSalvo
                  ? "Salve o código SICA antes de confirmar"
                  : !sicaAtivaNoSst
                    ? "A empresa precisa estar ativa no SICA antes de confirmar"
                    : undefined
              }
              className="bg-primary text-primary-foreground hover:bg-sakura-600 disabled:hover:bg-primary flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar Cadastramento
            </BotaoSubmitComLoading>
          </form>
          {erroConfirmar ? (
            <p className="text-destructive text-xs font-medium">{erroConfirmar}</p>
          ) : null}
        </div>
      ) : null}

      <AlertaTravelLinkModal
        aberto={alertaTravelLinkAberto}
        onFechar={() => setAlertaTravelLinkAberto(false)}
      />
    </div>
  );
}
