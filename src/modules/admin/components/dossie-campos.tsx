"use client";

import {
  useState,
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";
import type { DadosReceitaCnae } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  AnaliseIaResumo,
  DocumentoRevisao,
  ParecerIaView,
} from "@/modules/admin/types/dossie.types";
import type { AnaliseIaComparacaoCampo } from "@/modules/cadastro/domain/services/document-analysis-service";
import { alertasVisiveis } from "@/modules/cadastro/utils/alerta-analise.util";
import { VisualizarDocumento } from "@/modules/admin/components/visualizar-documento";
import { formatarData } from "@/modules/admin/utils/dossie-campos.util";

// Blocos de apresentação reaproveitados entre o dossiê do funil
// (/cadastros/[id]) e o dossiê do arquivo (/arquivo/[id]) — mesma
// "ficha" de Empresa/Receita/Sócios, sem nenhuma regra de negócio
// própria de cada rota.

// Par rótulo/valor reaproveitado em todas as seções — rótulo neutro (a cor
// de marca fica reservada pra ação primária e identidade, não pra rótulo
// estrutural) e valor em destaque. Fundo próprio (bg-card) pra funcionar
// como "célula" dentro de CamposGrid (ver truque do seam abaixo).
export function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card px-3 py-2.5 ${className ?? ""}`}>
      <dt className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">{label}</dt>
      <dd className="text-foreground mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

// Grid de Campo com linhas horizontais E verticais de verdade (pedido
// explícito do usuário — "todo o sistema carece de linhas", 2026-07-24),
// via truque do "seam": o fundo do container é a cor da linha
// (bg-border) e cada Campo é opaco (bg-card) com gap-px entre eles — o
// fundo aparece como um fio de 1px em toda borda de célula, mesmo com
// grid quebrando linha (divide-x/divide-y não dá conta disso num grid
// que quebra, só em sequência linear).
export function CamposGrid({ children, className }: { children: ReactNode; className?: string }) {
  // Número ímpar de Campo deixa uma célula vazia no grid de 2 colunas —
  // sem elemento nenhum ali, só o bg-border do container aparecendo
  // como um bloco sólido feio. Corrige esticando o último Campo pra
  // ocupar a linha inteira nesse caso.
  const itens = Children.toArray(children);
  const itensAjustados =
    itens.length % 2 === 0
      ? itens
      : itens.map((item, index) => {
          if (index !== itens.length - 1 || !isValidElement(item)) return item;
          const elemento = item as ReactElement<{ className?: string }>;
          return cloneElement(elemento, {
            className: `${elemento.props.className ?? ""} sm:col-span-2`,
          });
        });

  return (
    <dl
      className={`border-border bg-border grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2 ${className ?? ""}`}
    >
      {itensAjustados}
    </dl>
  );
}

// Cabeçalho de subseção dentro de uma SecaoColapsavel — agrupa campos
// relacionados (ex: "Contato", "Endereço") sem precisar de outra seção
// colapsável só pra isso.
export function SubsecaoLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
      {children}
    </span>
  );
}

// Situação cadastral vira badge colorido (mesma linguagem semântica dos
// badges de status do funil) em vez de texto plano — bate o olho se a
// empresa está ativa/baixada sem precisar ler a palavra toda.
export function SituacaoCadastralBadge({ situacao }: { situacao: string | null }) {
  if (!situacao) return <span className="text-muted-foreground">—</span>;

  const normalizado = situacao.toLowerCase();
  const classes = normalizado.includes("ativa")
    ? "bg-success-bg text-success-text"
    : /baixada|inapta|suspensa|nula/.test(normalizado)
      ? "bg-destructive-bg text-destructive-text"
      : "bg-muted text-muted-foreground";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${classes}`}>
      {situacao}
    </span>
  );
}

// CNAEs vêm como lista plana (principal + secundários) — destaca o
// principal e esconde os secundários atrás de um <details> pra não
// poluir a ficha quando a empresa tem muitas atividades cadastradas.
export function CnaesDetalhe({ cnaes }: { cnaes: DadosReceitaCnae[] }) {
  if (cnaes.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const principal = cnaes.find((cnae) => cnae.principal);
  const secundarios = cnaes.filter((cnae) => !cnae.principal);

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {principal ? (
        <span>
          <span className="bg-primary/15 text-primary mr-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
            Principal
          </span>
          {principal.codigo} — {principal.descricao}
        </span>
      ) : null}
      {secundarios.length > 0 ? (
        <details className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5 text-xs">
          <summary className="text-primary cursor-pointer font-semibold">
            Ver CNAEs secundários ({secundarios.length})
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1">
            {secundarios.map((cnae, index) => (
              <li key={index}>
                {cnae.codigo} — {cnae.descricao}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

type AprovarDocumentoActionFn = (
  agenciaId: string,
  documentoId: string,
  formData: FormData,
) => Promise<void>;
type ReprovarDocumentoActionFn = AprovarDocumentoActionFn;
type InserirDocumentoManualActionFn = (
  agenciaId: string,
  tipo: TipoDocumento,
  representanteLegalId: string | null,
  formData: FormData,
) => Promise<void>;

// Quem/quando/por quê o documento chegou no status atual — sempre visível
// (ver infoAuditoria em VisualizarDocumento), não só no `title` de um
// badge. Aprovação manual passou a exigir motivo igual à reprovação
// (decisão do usuário, 2026-07-26: se um analista decidiu manualmente em
// vez de deixar a IA seguir sozinha, algo levou a essa exceção). PENDENTE
// sem decisão nenhuma não tem nada a mostrar aqui, exceto quando foi
// inserido manualmente pelo analista (ver Documento.inseridoManualmentePor)
// ou reenviado pelo cliente depois de uma reprovação (`reenviado`, ver
// documentosAguardandoRevisaoPosReenvio em dossie.adapter.ts) — aí mostra
// só o contexto de por que está aguardando, já que a decisão em si ainda
// não aconteceu.
function AuditoriaDocumento({
  documento,
  reenviado = false,
}: {
  documento: Documento;
  reenviado?: boolean;
}) {
  if (documento.status === "APROVADO") {
    return (
      <p className="text-success text-xs font-medium">
        Aprovado por {documento.aprovadoPor ?? "—"}
        {documento.aprovadoEm ? ` em ${formatarData(documento.aprovadoEm)}` : ""}
        {documento.motivoAprovacao ? ` — motivo: ${documento.motivoAprovacao}` : ""}
      </p>
    );
  }

  if (documento.status === "REPROVADO") {
    return (
      <p className="text-destructive text-xs font-medium">
        Reprovado por {documento.reprovadoPor ?? "—"}
        {documento.reprovadoEm ? ` em ${formatarData(documento.reprovadoEm)}` : ""}
        {documento.motivoReprovacao ? ` — motivo: ${documento.motivoReprovacao}` : ""}
      </p>
    );
  }

  if (documento.inseridoManualmentePor) {
    return (
      <p className="text-muted-foreground text-xs font-medium">
        Enviado manualmente por {documento.inseridoManualmentePor} em{" "}
        {formatarData(documento.createdAt)}, aguardando decisão.
      </p>
    );
  }

  if (reenviado) {
    return (
      <span className="bg-warning/15 text-warning w-fit rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
        Reenviado — aguardando revisão
      </span>
    );
  }

  return null;
}

const BOTAO_DECISAO_DOCUMENTO =
  "rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
const TEXTAREA_MOTIVO_DECISAO =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2";

// Aprovar/Reprovar do documento — sempre dentro do modal de
// pré-visualização (ver acoes em VisualizarDocumento), nunca decidido só
// olhando a linha/rótulo. As duas ações abrem uma textarea de motivo
// obrigatória antes de confirmar — aprovar deixou de ser 1 clique
// (decisão do usuário, 2026-07-26): aprovação manual é exceção (a IA
// aprovaria sozinha se estivesse tudo certo), então precisa do mesmo
// "por quê" que a reprovação já exige.
function AcoesAprovacaoDocumento({
  agenciaId,
  documentoId,
  status,
  aprovarDocumentoAction,
  reprovarDocumentoAction,
  somenteLeitura = false,
}: {
  agenciaId: string;
  documentoId: string;
  status: Documento["status"];
  aprovarDocumentoAction: AprovarDocumentoActionFn;
  reprovarDocumentoAction: ReprovarDocumentoActionFn;
  somenteLeitura?: boolean;
}) {
  const [modo, setModo] = useState<"aprovar" | "reprovar" | null>(null);

  if (somenteLeitura) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModo(modo === "aprovar" ? null : "aprovar")}
          className={`${BOTAO_DECISAO_DOCUMENTO} ${
            status === "APROVADO"
              ? "border-success bg-success text-success-foreground"
              : "border-input text-foreground hover:bg-accent"
          }`}
        >
          Aprovar
        </button>
        <button
          type="button"
          onClick={() => setModo(modo === "reprovar" ? null : "reprovar")}
          className={`${BOTAO_DECISAO_DOCUMENTO} border-input text-foreground hover:bg-accent`}
        >
          Reprovar
        </button>
      </div>

      {modo === "aprovar" ? (
        <form
          action={async (formData) => {
            await aprovarDocumentoAction(agenciaId, documentoId, formData);
            setModo(null);
          }}
          className="flex flex-col gap-2 border-t border-dashed pt-2"
        >
          <textarea
            name="motivo"
            required
            rows={2}
            placeholder="Motivo da aprovação (obrigatório)"
            className={TEXTAREA_MOTIVO_DECISAO}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="border-success bg-success text-success-foreground rounded-full border px-3 py-1 text-xs font-semibold transition"
            >
              Confirmar aprovação
            </button>
            <button
              type="button"
              onClick={() => setModo(null)}
              className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1 text-xs font-medium transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {modo === "reprovar" ? (
        <form
          action={async (formData) => {
            await reprovarDocumentoAction(agenciaId, documentoId, formData);
            setModo(null);
          }}
          className="flex flex-col gap-2 border-t border-dashed pt-2"
        >
          <textarea
            name="motivo"
            required
            rows={2}
            placeholder="Motivo da reprovação (obrigatório — o cliente vê isso na página de reenvio)"
            className={TEXTAREA_MOTIVO_DECISAO}
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
              onClick={() => setModo(null)}
              className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1 text-xs font-medium transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

// Upload manual do analista pra um slot vazio ou reprovado (ver
// InserirDocumentoManualUseCase) — entra PENDENTE, segue o mesmo
// Aprovar/Reprovar de sempre. Só aparece quando `!somenteLeitura` (chamado
// pelo pai, ver CampoDocumento).
function InserirDocumentoManual({
  agenciaId,
  tipo,
  representanteLegalId,
  inserirDocumentoManualAction,
}: {
  agenciaId: string;
  tipo: TipoDocumento;
  representanteLegalId: string | null;
  inserirDocumentoManualAction: InserirDocumentoManualActionFn;
}) {
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      action={async (formData) => {
        setEnviando(true);
        try {
          await inserirDocumentoManualAction(agenciaId, tipo, representanteLegalId, formData);
        } finally {
          setEnviando(false);
        }
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        type="file"
        name="arquivo"
        required
        accept="application/pdf,image/jpeg,image/png"
        className="text-muted-foreground max-w-56 text-xs"
      />
      <button
        type="submit"
        disabled={enviando}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Inserir documento"}
      </button>
    </form>
  );
}

// Referência de arquivo (contrato social, RG, procuração) em destaque —
// mesmo tratamento de "código"/citação usado no mapa-redesign-sakura.html
// (fundo tintado + cor de marca + monoespaçada). Clicável: abre a
// pré-visualização em modal (ver VisualizarDocumento), agora sempre com
// aprovar/reprovar + auditoria embutidos — antes só a lista da seção
// "Documentação" tinha isso, e o mesmo documento aparecia sem ação aqui
// (decisão do usuário, 2026-07-26: centralizar num modal só).
//
// `analise` é opcional e distingue dois casos: omitido (não passado) mantém
// o modal em coluna única de sempre (usado no histórico de versões
// antigas, que não tem análise vinculada); passado (mesmo que `null`, doc
// ainda não analisado) liga o painel esquerdo com "Sem análise de IA".
export function Arquivo({
  documento,
  analise,
  agenciaId,
  aprovarDocumentoAction,
  reprovarDocumentoAction,
  somenteLeitura = false,
  reenviado = false,
}: {
  documento: Documento;
  analise?: AnaliseIaResumo | null;
  // Opcionais: /arquivo/[id] mostra o mesmo dossiê já finalizado, sempre
  // somente leitura, sem action de aprovar/reprovar disponível — ver
  // guarda abaixo (só monta AcoesAprovacaoDocumento quando os três estão
  // presentes).
  agenciaId?: string;
  aprovarDocumentoAction?: AprovarDocumentoActionFn;
  reprovarDocumentoAction?: ReprovarDocumentoActionFn;
  somenteLeitura?: boolean;
  reenviado?: boolean;
}) {
  const nomeArquivo = documento.gcsPath.split("/").pop() ?? documento.gcsPath;
  const temAuditoria =
    documento.status === "APROVADO" ||
    documento.status === "REPROVADO" ||
    documento.inseridoManualmentePor !== null ||
    reenviado;

  return (
    <VisualizarDocumento
      documentoId={documento.id}
      gcsPath={documento.gcsPath}
      label={nomeArquivo}
      painelEsquerdo={analise !== undefined ? <AnaliseIaDetalhe analise={analise} /> : undefined}
      infoAuditoria={
        temAuditoria ? (
          <AuditoriaDocumento documento={documento} reenviado={reenviado} />
        ) : undefined
      }
      acoes={
        agenciaId && aprovarDocumentoAction && reprovarDocumentoAction ? (
          <AcoesAprovacaoDocumento
            agenciaId={agenciaId}
            documentoId={documento.id}
            status={documento.status}
            aprovarDocumentoAction={aprovarDocumentoAction}
            reprovarDocumentoAction={reprovarDocumentoAction}
            somenteLeitura={somenteLeitura}
          />
        ) : undefined
      }
    >
      <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-semibold break-all">
        {nomeArquivo}
      </span>
    </VisualizarDocumento>
  );
}

// Documento reprovado sai do rol "oficial" da ficha (Empresa/Sócios) —
// mostra que está faltando reenvio em vez do arquivo que foi rejeitado,
// já que o soft-delete só marca o status, não apaga a linha do banco.
// Slot vazio ou reprovado ganham o upload manual (ver
// InserirDocumentoManual) — os únicos dois estados em que inserir
// manualmente é permitido (ver InserirDocumentoManualUseCase).
export function CampoDocumento({
  documento,
  analise,
  agenciaId,
  tipo,
  representanteLegalId = null,
  aprovarDocumentoAction,
  reprovarDocumentoAction,
  inserirDocumentoManualAction,
  somenteLeitura = false,
  reenviado = false,
}: {
  documento: Documento | null;
  analise?: AnaliseIaResumo | null;
  // Opcionais pela mesma razão de Arquivo acima: /arquivo/[id] usa este
  // componente só pra exibição, sem nenhuma action de escrita disponível.
  agenciaId?: string;
  tipo?: TipoDocumento;
  representanteLegalId?: string | null;
  aprovarDocumentoAction?: AprovarDocumentoActionFn;
  reprovarDocumentoAction?: ReprovarDocumentoActionFn;
  inserirDocumentoManualAction?: InserirDocumentoManualActionFn;
  somenteLeitura?: boolean;
  reenviado?: boolean;
}) {
  if (!documento) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground">—</span>
        {!somenteLeitura && agenciaId && tipo && inserirDocumentoManualAction ? (
          <InserirDocumentoManual
            agenciaId={agenciaId}
            tipo={tipo}
            representanteLegalId={representanteLegalId}
            inserirDocumentoManualAction={inserirDocumentoManualAction}
          />
        ) : null}
      </div>
    );
  }

  if (documento.status === "REPROVADO") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="bg-warning-bg text-warning-text w-fit rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
          Aguardando reenvio
        </span>
        <AuditoriaDocumento documento={documento} />
        {!somenteLeitura && agenciaId && tipo && inserirDocumentoManualAction ? (
          <InserirDocumentoManual
            agenciaId={agenciaId}
            tipo={tipo}
            representanteLegalId={representanteLegalId}
            inserirDocumentoManualAction={inserirDocumentoManualAction}
          />
        ) : null}
      </div>
    );
  }

  return (
    <Arquivo
      documento={documento}
      analise={analise}
      agenciaId={agenciaId}
      aprovarDocumentoAction={aprovarDocumentoAction}
      reprovarDocumentoAction={reprovarDocumentoAction}
      somenteLeitura={somenteLeitura}
      reenviado={reenviado}
    />
  );
}

const PARECER_DOCUMENTO_CLASSES: Record<string, string> = {
  APROVADO: "bg-success-bg text-success-text",
  REPROVADO: "bg-destructive-bg text-destructive-text",
  PENDENTE: "bg-warning-bg text-warning-text",
};

// Badge de uma checagem estrutural (formato válido, campos obrigatórios
// presentes, referência cruzada ok) — omitida quando `null` (a IA não
// avaliou esse critério pra esse documento, não é "reprovou").
function ChecagemBadge({ label, valor }: { label: string; valor: boolean | null }) {
  if (valor === null) return null;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
        valor ? "bg-success-bg text-success-text" : "bg-destructive-bg text-destructive-text"
      }`}
    >
      {label}: {valor ? "sim" : "não"}
    </span>
  );
}

// Formata qualquer valor de `camposExtraidos` (schema livre, decidido pelo
// agente — nunca documentado, ver comentário de CamposDetalhe abaixo) sem
// cair em `String()` cru: objeto vira "[object Object]" e array de objeto
// vira "[object Object],[object Object]" (ex.: `qsa`, um array de sócios);
// array com posição vazia (ex.: `endereco` chegando como array posicional
// em vez de objeto nomeado, num documento real) vira "a,,b" — os dois
// achados vieram do mesmo bug. Recursivo: filtra valor vazio em vez de
// deixar a lacuna, e desce em objeto/array até sobrar só primitivo.
function formatarValorExtraido(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "string") return valor.trim().length > 0 ? valor : "—";
  if (typeof valor === "number" || typeof valor === "boolean") return String(valor);

  if (Array.isArray(valor)) {
    const itens = valor.map(formatarValorExtraido).filter((item) => item !== "—");
    return itens.length > 0 ? itens.join(" | ") : "—";
  }

  if (typeof valor === "object") {
    const entradas = Object.entries(valor as Record<string, unknown>)
      .map(([chave, item]) => {
        const formatado = formatarValorExtraido(item);
        return formatado === "—" ? null : `${chave}: ${formatado}`;
      })
      .filter((item): item is string => item !== null);
    return entradas.length > 0 ? entradas.join(", ") : "—";
  }

  return String(valor);
}

// Par chave/valor genérico, mesmo tratamento usado pra `camposExtraidos` —
// reaproveitado também por `camposExtras` e `detalhesChecagem`, que têm a
// mesma forma (Record<string, unknown> sem schema fixo, dependem do agente).
function CamposDetalhe({ titulo, campos }: { titulo: string; campos: Record<string, unknown> }) {
  const entradas = Object.entries(campos);
  if (entradas.length === 0) return null;

  return (
    <details className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5">
      <summary className="text-primary cursor-pointer text-xs font-semibold">
        {titulo} ({entradas.length})
      </summary>
      <dl className="mt-2 flex flex-col gap-1">
        {entradas.map(([chave, valor]) => (
          <div key={chave} className="flex flex-wrap gap-1.5">
            <dt className="text-muted-foreground shrink-0 font-mono">{chave}:</dt>
            <dd className="text-foreground break-all">{formatarValorExtraido(valor)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

// Comparação campo a campo com fonte oficial (Receita) — só populado pra
// contrato_social hoje (ver docs/agency-analysis-params-tracking.md).
// `confere: null` significa "nada a comparar" (campo não veio nem extraído
// nem oficial), não é divergência.
function ComparacaoOficialDetalhe({ campos }: { campos: AnaliseIaComparacaoCampo[] }) {
  if (campos.length === 0) return null;

  return (
    <details className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5">
      <summary className="text-primary cursor-pointer text-xs font-semibold">
        Comparação oficial ({campos.length})
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5">
        {campos.map((item) => (
          <li key={item.campo} className="flex items-start gap-1.5">
            <span
              className={
                item.confere === true
                  ? "text-success"
                  : item.confere === false
                    ? "text-destructive"
                    : "text-muted-foreground"
              }
            >
              {item.confere === true ? "✓" : item.confere === false ? "✗" : "—"}
            </span>
            <span>
              <span className="text-foreground font-mono">{item.campo}</span>
              <span className="text-muted-foreground">
                {" "}
                — extraído &quot;{item.extraido ?? "—"}&quot;, oficial &quot;
                {item.oficial ?? "—"}&quot;
                {item.fornecido ? `, fornecido "${item.fornecido}"` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

// Mostra a análise de IA gravada sobre o documento (RG/CNH, contrato
// social) — lida de volta agora que FinalizarCadastroUseCase passou a
// persistir isso (antes era descartada). Os nomes de campo dentro de
// `camposExtraidos` não são documentados em lugar nenhum do projeto
// (dependem do agente externo), então mostra exatamente como veio em vez
// de rotular como "RG"/"Órgão emissor" — seria inventar uma
// correspondência não confirmada.
export function AnaliseIaDetalhe({ analise }: { analise: AnaliseIaResumo | null }) {
  if (!analise) {
    return (
      <span className="text-muted-foreground text-xs">Sem análise de IA pra este documento.</span>
    );
  }

  const alertas = alertasVisiveis(analise.alertas);

  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        {analise.parecer ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              PARECER_DOCUMENTO_CLASSES[analise.parecer] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {analise.parecer}
          </span>
        ) : null}
        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
          Confiança: {analise.confiancaExtracao}
        </span>
        {alertas.length > 0 ? (
          <span className="bg-warning/15 text-warning rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
            {alertas.length} alerta{alertas.length > 1 ? "s" : ""}
          </span>
        ) : null}
        <ChecagemBadge label="Formato" valor={analise.formatoValido} />
        <ChecagemBadge label="Campos obrigatórios" valor={analise.camposObrigatoriosPresentes} />
        <ChecagemBadge label="Ref. cruzada" valor={analise.referenciaCruzadaOk} />
      </div>

      {analise.resumoAnalise ? (
        <p className="text-muted-foreground">{analise.resumoAnalise}</p>
      ) : null}

      {alertas.length > 0 ? (
        <ul className="list-inside list-disc">
          {alertas.map((alerta, index) => (
            <li
              key={index}
              className={alerta.tipo === "erro" ? "text-destructive" : "text-warning"}
            >
              {alerta.mensagem}
            </li>
          ))}
        </ul>
      ) : null}

      {analise.comparacaoOficial ? (
        <ComparacaoOficialDetalhe campos={analise.comparacaoOficial} />
      ) : null}

      {Object.keys(analise.camposExtraidos).length > 0 ? (
        <CamposDetalhe titulo="Ver campos extraídos" campos={analise.camposExtraidos} />
      ) : (
        <span className="text-muted-foreground">Nenhum campo estruturado extraído.</span>
      )}

      <CamposDetalhe titulo="Ver campos extras" campos={analise.camposExtras} />
      {analise.detalhesChecagem ? (
        <CamposDetalhe titulo="Ver detalhes da checagem" campos={analise.detalhesChecagem} />
      ) : null}

      {analise.textoBruto ? (
        <details className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5">
          <summary className="text-primary cursor-pointer text-xs font-semibold">
            Ver texto bruto extraído
          </summary>
          <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{analise.textoBruto}</p>
        </details>
      ) : null}
    </div>
  );
}

const RESULTADO_ANALISE_LABELS: Record<string, string> = {
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado pela IA",
  REPROVADO: "Reprovado pela IA",
  FALHA_ANALISE: "Falha técnica na análise",
  FALHA_CONTRATO: "Falha na geração do contrato",
};

const RESULTADO_ANALISE_CLASSES: Record<string, string> = {
  EM_ANALISE: "bg-muted text-muted-foreground",
  APROVADO: "bg-success-bg text-success-text",
  REPROVADO: "bg-destructive-bg text-destructive-text",
  FALHA_ANALISE: "bg-warning-bg text-warning-text",
  FALHA_CONTRATO: "bg-warning-bg text-warning-text",
};

// Badge do veredito — chaveado por `resultado` (ResultadoAnaliseIa), não
// pelo `parecer` bruto do agente externo: `resultado` já separa
// reprovação real (REPROVADO) de falha técnica (FALHA_ANALISE/
// FALHA_CONTRATO) e do estado ainda pendente (EM_ANALISE), enquanto
// `parecer` fica null nas falhas técnicas (nunca chegou a existir um
// veredito de verdade).
function ResultadoBadge({ resultado }: { resultado: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
        RESULTADO_ANALISE_CLASSES[resultado] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {RESULTADO_ANALISE_LABELS[resultado] ?? resultado}
    </span>
  );
}

// Seção única "Parecer": consolida o veredito da IA sobre a agência, o
// motivo de não ter passado direto pra contrato, os pontos de alerta
// (flagsRisco) e o checklist do que o analista precisa checar — pedido
// explícito do usuário em vez de espalhar essa informação em blocos
// separados pela ficha. `parecer` só vem null pra cadastros criados
// antes desta funcionalidade existir — qualquer cadastro novo já nasce
// com a linha em EM_ANALISE.
export function ParecerIa({ parecer }: { parecer: ParecerIaView | null }) {
  if (!parecer) {
    return (
      <span className="text-muted-foreground text-xs">
        Sem parecer de IA registrado pra este cadastro.
      </span>
    );
  }

  const emAnalise = parecer.resultado === "EM_ANALISE";

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ResultadoBadge resultado={parecer.resultado} />
        <span className="text-muted-foreground text-xs">
          {emAnalise ? "desde" : "avaliado em"} {formatarData(parecer.avaliadoEm)}
        </span>
      </div>

      {parecer.parecer ? (
        <p>
          <strong className="text-foreground">Parecer do agente:</strong> {parecer.parecer}
        </p>
      ) : null}

      {parecer.motivo ? <p className="text-foreground">{parecer.motivo}</p> : null}

      {parecer.pontosDeAlerta.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SubsecaoLabel>Pontos de alerta</SubsecaoLabel>
          <ul className="text-warning list-inside list-disc text-xs">
            {parecer.pontosDeAlerta.map((ponto, index) => (
              <li key={index}>{ponto}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {parecer.itensParaChecar.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SubsecaoLabel>O que o analista precisa checar</SubsecaoLabel>
          <ul className="flex flex-col gap-1.5">
            {parecer.itensParaChecar.map((item, index) => (
              <li
                key={index}
                className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5 text-xs"
              >
                <span className="text-foreground font-semibold">{item.origem}: </span>
                <span className="text-muted-foreground">{item.mensagem}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

// Versões antigas do mesmo slot (histórico de reprovações/reenvios) —
// nunca sobrescreve nem apaga, só empilha (ver historicoDoSlot em
// dossie.adapter.ts). Fica escondido atrás de um <details> pra não
// poluir a ficha quando não há nada a revisar. Reaproveitado tanto pela
// revisão de documentos do funil (com Aprovar/Reprovar) quanto pela
// lista somente-leitura do Arquivo.
export function HistoricoDocumento({ historico }: { historico: DocumentoRevisao["historico"] }) {
  if (historico.length === 0) return null;

  return (
    <details className="border-border bg-muted/20 rounded-lg border px-3 py-2 text-xs">
      <summary className="text-muted-foreground cursor-pointer font-semibold">
        Ver histórico ({historico.length})
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {historico.map((item) => (
          <div
            key={item.id}
            className="border-border flex flex-col gap-1 border-t pt-2 first:border-0 first:pt-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <VisualizarDocumento
                documentoId={item.id}
                gcsPath={item.gcsPath}
                label="Versão anterior"
              >
                <span className="text-primary font-semibold">Ver anexo</span>
              </VisualizarDocumento>
              <span className="bg-destructive-bg text-destructive-text rounded-full px-2 py-0.5 font-bold uppercase">
                {item.status}
              </span>
              <span className="text-muted-foreground">{formatarData(item.createdAt)}</span>
            </div>
            {item.motivoReprovacao ? (
              <p className="text-muted-foreground">
                Motivo: {item.motivoReprovacao}
                {item.reprovadoPor ? ` — reprovado por ${item.reprovadoPor}` : ""}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </details>
  );
}
