import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type {
  DadosReceitaEndereco,
  DadosReceitaCnae,
} from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  AnaliseIaResumo,
  DocumentoRevisao,
  ParecerIaView,
} from "@/modules/admin/types/dossie.types";
import { alertasVisiveis } from "@/modules/cadastro/utils/alerta-analise.util";
import { VisualizarDocumento } from "@/modules/admin/components/visualizar-documento";

// Blocos de apresentação reaproveitados entre o dossiê do funil
// (/painel/[id]) e o dossiê do arquivo (/arquivo/[id]) — mesma
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

export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

export function formatarDataCurta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);
}

export function formatarMoedaBrl(valor: number | null): string {
  if (valor === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

// Endereço de Dados da Receita tem campos todos opcionais (a Receita nem
// sempre devolve tudo) — formatação própria, diferente de formatarEndereco
// (que espera os campos sempre preenchidos, vindos do que o próprio
// usuário digitou no wizard).
export function formatarEnderecoReceita(endereco: DadosReceitaEndereco | null): string {
  if (!endereco || !endereco.logradouro) return "—";
  const complemento = endereco.complemento ? `, ${endereco.complemento}` : "";
  return `${endereco.logradouro}, ${endereco.numero || "s/n"}${complemento} — ${endereco.bairro ?? "—"}, ${endereco.cidade ?? "—"}/${endereco.uf ?? "—"}`;
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

// Referência de arquivo (contrato social, RG, procuração) em destaque —
// mesmo tratamento de "código"/citação usado no mapa-redesign-sakura.html
// (fundo tintado + cor de marca + monoespaçada). Clicável: abre a
// pré-visualização em modal (ver VisualizarDocumento) em vez de só
// mostrar o nome do arquivo sem nenhuma ação.
//
// `analise` é opcional e distingue dois casos: omitido (não passado) mantém
// o modal em coluna única de sempre (usado no histórico de versões
// antigas, que não tem análise vinculada); passado (mesmo que `null`, doc
// ainda não analisado) liga o painel esquerdo com "Sem análise de IA".
export function Arquivo({
  documento,
  analise,
}: {
  documento: Documento;
  analise?: AnaliseIaResumo | null;
}) {
  const nomeArquivo = documento.gcsPath.split("/").pop() ?? documento.gcsPath;
  return (
    <VisualizarDocumento
      documentoId={documento.id}
      gcsPath={documento.gcsPath}
      label={nomeArquivo}
      painelEsquerdo={analise !== undefined ? <AnaliseIaDetalhe analise={analise} /> : undefined}
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
export function CampoDocumento({
  documento,
  analise,
}: {
  documento: Documento | null;
  analise?: AnaliseIaResumo | null;
}) {
  if (!documento) return <span className="text-muted-foreground">—</span>;

  if (documento.status === "REPROVADO") {
    return (
      <span
        className="bg-warning-bg text-warning-text rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
        title={documento.motivoReprovacao ?? undefined}
      >
        Aguardando reenvio
      </span>
    );
  }

  return <Arquivo documento={documento} analise={analise} />;
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

  const campos = Object.entries(analise.camposExtraidos);
  const alertas = alertasVisiveis(analise.alertas);

  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
          Confiança: {analise.confiancaExtracao}
        </span>
        {alertas.length > 0 ? (
          <span className="bg-warning/15 text-warning rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
            {alertas.length} alerta{alertas.length > 1 ? "s" : ""}
          </span>
        ) : null}
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

      {campos.length > 0 ? (
        <details className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5">
          <summary className="text-primary cursor-pointer text-xs font-semibold">
            Ver campos extraídos ({campos.length})
          </summary>
          <dl className="mt-2 flex flex-col gap-1">
            {campos.map(([chave, valor]) => (
              <div key={chave} className="flex flex-wrap gap-1.5">
                <dt className="text-muted-foreground shrink-0 font-mono">{chave}:</dt>
                <dd className="text-foreground break-all">{String(valor)}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : (
        <span className="text-muted-foreground">Nenhum campo estruturado extraído.</span>
      )}
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
