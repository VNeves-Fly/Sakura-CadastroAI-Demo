"use client";

import {
  useState,
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Eye } from "lucide-react";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";
import type { DadosReceitaCnae } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  AnaliseIaResumo,
  DocumentoRevisao,
  ParecerIaView,
} from "@/modules/admin/types/dossie.types";
import type { AnaliseIaComparacaoCampo } from "@/modules/cadastro/domain/services/document-analysis-service";
import type {
  AnaliseIaCnaePrincipal,
  AnaliseIaEmailInfo,
  AnaliseIaStage1,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import { alertasVisiveis } from "@/modules/cadastro/utils/alerta-analise.util";
import { VisualizarDocumento } from "@/modules/admin/components/visualizar-documento";
import { formatarData, formatarPercentual } from "@/modules/admin/utils/dossie-campos.util";
import { formatarEndereco } from "@/modules/admin/adapters/dossie.adapter";
import { maskCep } from "@/modules/cadastro/utils/cep.util";

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
  corFundo = "bg-card",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  // Prop separada da `className` de propósito: um `bg-*` dentro de
  // `className` colidiria com o `bg-card` fixo (duas classes de mesma
  // propriedade, quem ganha depende da ordem no CSS gerado pelo
  // Tailwind, não da ordem na string) — ver corFundoDocumento em
  // dossie-campos.util.ts.
  corFundo?: string;
}) {
  return (
    <div className={`${corFundo} px-3 py-2.5 ${className ?? ""}`}>
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
function ehColSpan2(item: ReactNode): boolean {
  if (!isValidElement(item)) return false;
  const className = (item.props as { className?: string }).className ?? "";
  return className.includes("col-span-2");
}

export function CamposGrid({ children, className }: { children: ReactNode; className?: string }) {
  // Um Campo com "sm:col-span-2" no meio da lista (ex.: Endereço logo
  // depois de um número ímpar de Campos de 1 coluna) deixa a coluna
  // anterior sem par — célula vazia no grid, sem elemento nenhum ali, só
  // o bg-border do container aparecendo como um bloco sólido feio.
  // Preenche essa lacuna com uma célula vazia antes de esticar o item,
  // rastreando a coluna corrente conforme a largura real de cada Campo.
  const itens = Children.toArray(children);
  const itensComPreenchimento: ReactNode[] = [];
  let coluna = 0;

  itens.forEach((item, index) => {
    const largura = ehColSpan2(item) ? 2 : 1;
    if (largura === 2 && coluna === 1) {
      itensComPreenchimento.push(<div key={`preenchimento-${index}`} className="bg-card" />);
      coluna = 0;
    }
    itensComPreenchimento.push(item);
    coluna = (coluna + largura) % 2;
  });

  // Mesma lógica de sempre pro caso de terminar em coluna ímpar: estica
  // o último Campo pra ocupar a linha inteira.
  const itensAjustados =
    coluna === 0
      ? itensComPreenchimento
      : itensComPreenchimento.map((item, index) => {
          if (index !== itensComPreenchimento.length - 1 || !isValidElement(item)) return item;
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

interface CampoEnderecoValor {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

// Endereço de sócio/agência: linha única formatada por padrão (o que o
// analista precisa pra bater o olho) com os campos separados (CEP,
// logradouro, número...) escondidos atrás de um <details> — mesmo padrão
// de CnaesDetalhe/CamposDetalhe abaixo — pra consultar só quando precisar
// conferir um campo específico (ex.: preencher o TravelLink).
export function CampoEndereco({
  label,
  endereco,
}: {
  label: string;
  endereco: CampoEnderecoValor;
}) {
  return (
    <Campo label={label} className="sm:col-span-2">
      <div className="flex flex-col gap-1.5">
        <span>{formatarEndereco(endereco)}</span>
        {endereco.logradouro ? (
          <details className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5 text-xs">
            <summary className="text-primary cursor-pointer font-semibold">
              Ver campos separados
            </summary>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">CEP</dt>
                <dd className="text-foreground font-medium">
                  {endereco.cep ? maskCep(endereco.cep) : "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Logradouro</dt>
                <dd className="text-foreground font-medium">{endereco.logradouro}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Número</dt>
                <dd className="text-foreground font-medium">{endereco.numero || "s/n"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Complemento</dt>
                <dd className="text-foreground font-medium">{endereco.complemento || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Bairro</dt>
                <dd className="text-foreground font-medium">{endereco.bairro || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cidade</dt>
                <dd className="text-foreground font-medium">{endereco.cidade || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">UF</dt>
                <dd className="text-foreground font-medium">{endereco.uf || "—"}</dd>
              </div>
            </dl>
          </details>
        ) : null}
      </div>
    </Campo>
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

// CNAEs do stage1 (com compatibilidade de turismo) — mesmo layout de
// CnaesDetalhe (destaque do principal, secundários atrás de <details>), mas
// com um badge extra por item indicando se a atividade é compatível com o
// segmento de turismo (critério do agente, ver AnaliseIaCnaePrincipal).
// Fonte diferente de CnaesDetalhe (stage1 em vez de DadosReceita.cnaes) —
// esta é a que de fato vem populada hoje.
function CnaesStage1Detalhe({
  principal,
  secundarios,
}: {
  principal: AnaliseIaCnaePrincipal | null;
  secundarios: AnaliseIaCnaePrincipal[];
}) {
  if (!principal && secundarios.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {principal ? (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
            Principal
          </span>
          {principal.codigo} — {principal.descricao}
          <ChecagemBadge label="Turismo" valor={principal.compativelTurismo} />
        </span>
      ) : null}
      {secundarios.length > 0 ? (
        <details className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5 text-xs">
          <summary className="text-primary cursor-pointer font-semibold">
            Ver CNAEs secundários ({secundarios.length})
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {secundarios.map((cnae, index) => (
              <li key={index} className="flex flex-wrap items-center gap-1.5">
                {cnae.codigo} — {cnae.descricao}
                <ChecagemBadge label="Turismo" valor={cnae.compativelTurismo} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

// Verificação cadastral (stage1) — comparação fornecido x oficial que o
// agente já calcula na avaliação (e-mail, sócios) mais CNAEs com
// compatibilidade de turismo. Razão Social/Nome Fantasia (também stage1)
// saíram daqui e foram pro bloco Empresa (ver ComparacaoEmpresaCampo em
// vez de duplicar a mesma comparação em duas seções, decisão do usuário
// 2026-08-01). Decisão do usuário (2026-07-27): mostrar esse dado no
// dossiê em vez de descartá-lo depois de calculado (ver
// paraVerificacaoCadastralView em dossie.adapter.ts). null tanto em
// cadastros anteriores a essa funcionalidade quanto quando o agente não
// trouxe stage1 (ex.: mock local sem AGENCY_ANALYSIS_API_KEY).
export function VerificacaoCadastral({ stage1 }: { stage1: AnaliseIaStage1 | null }) {
  if (!stage1) {
    return (
      <p className="text-muted-foreground text-sm">
        Verificação cadastral não disponível — cadastro anterior a esta funcionalidade, ou a IA não
        retornou esses dados pra este cadastro.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CamposGrid>
        <Campo label="E-mail">
          {stage1.email ? (
            <span className="flex flex-col gap-1">
              <span>{stage1.email.fornecido ?? "—"}</span>
              <span className="flex flex-wrap gap-1.5">
                <ChecagemBadge label="MX" valor={stage1.email.hasMx} />
                <ChecagemBadge label="Corporativo" valor={stage1.email.corporativo} />
              </span>
            </span>
          ) : (
            "—"
          )}
        </Campo>
        <Campo label="Processos">
          {stage1.processos ? (
            <span className="flex flex-col gap-1">
              <ChecagemBadge label="Verificado" valor={stage1.processos.verificado} />
              {stage1.processos.resumo ? (
                <span className="text-muted-foreground text-xs">{stage1.processos.resumo}</span>
              ) : null}
            </span>
          ) : (
            "—"
          )}
        </Campo>
      </CamposGrid>

      <div className="flex flex-col gap-2">
        <SubsecaoLabel>Atividades (CNAE)</SubsecaoLabel>
        <CnaesStage1Detalhe
          principal={stage1.cnaePrincipal}
          secundarios={stage1.cnaesSecundarios}
        />
      </div>

      {stage1.socios ? (
        <div className="flex flex-col gap-2">
          <SubsecaoLabel>Sócios (fornecido x QSA oficial)</SubsecaoLabel>
          {stage1.socios.divergencias.length > 0 ? (
            <ul className="text-destructive list-inside list-disc text-xs">
              {stage1.socios.divergencias.map((divergencia, index) => (
                <li key={index}>{divergencia}</li>
              ))}
            </ul>
          ) : (
            <span className="text-success text-xs font-medium">
              Nenhuma divergência entre os sócios fornecidos e o QSA oficial.
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Bloco "Empresa" — Cadastro (o que vale pro contrato D4Sign, único valor
// editável por aqui, ver EditarEmpresaForm) ao lado do que a IA extraiu do
// Contrato Social (OCR, "Extraído") e do Oficial (Receita/Cadastur), com o
// parecer da IA (✓ confere/✗ diverge, mesma linguagem visual de
// ComparacaoOficialDetalhe) quando existir — hoje só pra Razão Social.
// Nome Fantasia não recebe `confere` (a IA não avalia isso estruturalmente
// pra esse campo aqui, decisão do usuário 2026-08-01: não fabricar um
// parecer nosso).
export function ComparacaoEmpresaCampo({
  label,
  cadastro,
  extraido,
  oficial,
  confere,
}: {
  label: string;
  cadastro: string | null;
  extraido: string | null;
  oficial: string | null;
  confere?: boolean | null;
}) {
  return (
    <Campo label={label}>
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5">
          {cadastro || "—"}
          {confere !== undefined ? (
            <span
              className={
                confere === true
                  ? "text-success"
                  : confere === false
                    ? "text-destructive"
                    : "text-muted-foreground"
              }
            >
              {confere === true ? "✓" : confere === false ? "✗" : "—"}
            </span>
          ) : null}
        </span>
        {extraido ? (
          <span className="text-muted-foreground text-xs">
            Extraído (contrato social): <span className="font-medium">{extraido}</span>
          </span>
        ) : null}
        {oficial ? (
          <span className="text-muted-foreground text-xs">
            Oficial (Receita): <span className="font-medium">{oficial}</span>
          </span>
        ) : null}
      </div>
    </Campo>
  );
}

interface FonteEnderecoComparado {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

const CAMPOS_ENDERECO_COMPARADO: Array<{ campo: keyof FonteEnderecoComparado; label: string }> = [
  { campo: "cep", label: "CEP" },
  { campo: "logradouro", label: "Logradouro" },
  { campo: "numero", label: "Número" },
  { campo: "complemento", label: "Complemento" },
  { campo: "bairro", label: "Bairro" },
  { campo: "cidade", label: "Cidade" },
  { campo: "uf", label: "UF" },
];

function valorEnderecoComparado(
  endereco: FonteEnderecoComparado | null,
  campo: keyof FonteEnderecoComparado,
): string {
  const bruto = endereco?.[campo];
  if (!bruto) return "—";
  return campo === "cep" ? maskCep(bruto) : bruto;
}

// Endereço da empresa nas 3 fontes (Cadastro | Extraído do contrato social
// | Oficial da Receita) — sem Parecer (a IA não avalia endereço
// estruturalmente, nem no stage1 nem na comparação por documento, decisão
// do usuário 2026-08-01: não fabricar uma comparação nossa). Mesmo padrão
// "linha única + <details> com os campos separados" de CampoEndereco, só
// que comparando as 3 fontes campo a campo em vez de mostrar só uma.
export function ComparacaoEnderecoEmpresa({
  cadastro,
  extraido,
  oficial,
}: {
  cadastro: CampoEnderecoValor;
  extraido: FonteEnderecoComparado | null;
  oficial: FonteEnderecoComparado | null;
}) {
  return (
    <Campo label="Endereço" className="sm:col-span-2">
      <div className="flex flex-col gap-1.5">
        <span>{formatarEndereco(cadastro)}</span>
        <details className="border-border bg-muted/30 rounded-lg border px-2.5 py-1.5 text-xs">
          <summary className="text-primary cursor-pointer font-semibold">
            Ver Cadastro × Extraído × Oficial
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {CAMPOS_ENDERECO_COMPARADO.map(({ campo, label }) => (
              <li key={campo}>
                <span className="text-foreground font-semibold">{label}:</span>{" "}
                <span className="text-muted-foreground">
                  Cadastro &quot;{valorEnderecoComparado(cadastro, campo)}&quot;, Extraído &quot;
                  {valorEnderecoComparado(extraido, campo)}&quot;, Oficial &quot;
                  {valorEnderecoComparado(oficial, campo)}&quot;
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </Campo>
  );
}

// E-mail de Contato com MX/Corporativo quando a IA tiver avaliado — é o
// único e-mail da empresa que hoje é mandado pra análise
// (AnalisarCadastroUseCase manda só `agencia.emailContato`); Operacional/
// Comercial/Financeiro nunca passaram por essa checagem, por isso não
// recebem esse componente.
export function CampoEmailContato({
  email,
  emailInfo,
}: {
  email: string;
  emailInfo: AnaliseIaEmailInfo | null;
}) {
  return (
    <Campo label="E-mail de Contato">
      <div className="flex flex-col gap-1">
        <span>{email || "—"}</span>
        {emailInfo ? (
          <span className="flex flex-wrap gap-1.5">
            <ChecagemBadge label="MX" valor={emailInfo.hasMx} />
            <ChecagemBadge label="Corporativo" valor={emailInfo.corporativo} />
          </span>
        ) : null}
      </div>
    </Campo>
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

  // Header/rodapé do modal (ver VisualizarDocumento) já ficam com o
  // fundo sistêmico verde/vermelho conforme a decisão — aqui só o botão
  // já confirmado usa o tom claro (contraste sobre esse fundo sólido); o
  // botão que não foi clicado permanece branco, decisão do usuário
  // (2026-07-27).
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModo(modo === "aprovar" ? null : "aprovar")}
          className={`${BOTAO_DECISAO_DOCUMENTO} ${
            status === "APROVADO"
              ? "border-success-bg bg-success-bg text-success-text"
              : "border-input bg-card text-foreground hover:bg-accent"
          }`}
        >
          Aprovar
        </button>
        <button
          type="button"
          onClick={() => setModo(modo === "reprovar" ? null : "reprovar")}
          className={`${BOTAO_DECISAO_DOCUMENTO} ${
            status === "REPROVADO"
              ? "border-destructive-bg bg-destructive-bg text-destructive-text"
              : "border-input bg-card text-foreground hover:bg-accent"
          }`}
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
            minLength={20}
            rows={2}
            placeholder="Motivo da aprovação (mínimo 20 caracteres)"
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
            minLength={20}
            rows={2}
            placeholder="Motivo da reprovação (mínimo 20 caracteres — o cliente vê isso na página de reenvio)"
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
    <div className="flex flex-col gap-1.5">
      <VisualizarDocumento
        documentoId={documento.id}
        gcsPath={documento.gcsPath}
        label={nomeArquivo}
        statusDecisao={documento.status}
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
        <span className="flex flex-wrap items-center gap-2">
          <span className="border-input hover:bg-accent inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition">
            <Eye className="size-3.5" />
            Visualizar
          </span>
          <span className="text-muted-foreground font-mono text-xs break-all">{nomeArquivo}</span>
        </span>
      </VisualizarDocumento>
      {documento.status === "PENDENTE" ? (
        <span className="bg-warning-bg text-warning-text w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
          Pendente
        </span>
      ) : null}
    </div>
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

const TIPOS_DOCUMENTO_OUTRO: { valor: TipoDocumento; label: string }[] = [
  { valor: "CADASTUR", label: "Cadastur" },
  { valor: "COMPROVANTE_ENDERECO", label: "Comprovante de Endereço" },
  { valor: "COMPROVANTE_ENDERECO_AGENCIA", label: "Comprovante de Endereço da Agência" },
  { valor: "CERTIDAO_CASAMENTO", label: "Certidão de Casamento" },
  { valor: "OUTROS", label: "Outros" },
];

const CLASSE_CAMPO_UPLOAD_OUTRO =
  "border-input bg-background text-foreground rounded-lg border px-2.5 py-1.5 text-xs outline-none";

// Upload de documento "extra" (fora dos slots fixos de Contrato Social/RG/
// Procuração, já cobertos por CampoDocumento) direto do arquivo — tipo,
// dono (agência ou sócio) e descrição livre (só quando tipo = Outros) são
// escolhidos no próprio formulário, já que aqui não existe um slot fixo por
// chamada (ver paraDocumentosOutros em dossie.adapter.ts, que descobre os
// slots existentes em vez de recebê-los prontos).
export function UploadDocumentoOutro({
  agenciaId,
  representantesLegais,
  inserirDocumentoArquivoAction,
}: {
  agenciaId: string;
  representantesLegais: { id: string; nome: string }[];
  inserirDocumentoArquivoAction: InserirDocumentoManualActionFn;
}) {
  const [tipo, setTipo] = useState<TipoDocumento>("CADASTUR");
  const [representanteLegalId, setRepresentanteLegalId] = useState("");
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      action={async (formData) => {
        setEnviando(true);
        try {
          await inserirDocumentoArquivoAction(
            agenciaId,
            tipo,
            representanteLegalId || null,
            formData,
          );
        } finally {
          setEnviando(false);
        }
      }}
      className="border-border bg-muted/20 flex flex-col gap-2 rounded-xl border border-dashed p-3"
    >
      <div className="flex flex-wrap gap-2">
        <select
          value={tipo}
          onChange={(event) => setTipo(event.target.value as TipoDocumento)}
          className={CLASSE_CAMPO_UPLOAD_OUTRO}
        >
          {TIPOS_DOCUMENTO_OUTRO.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
            </option>
          ))}
        </select>
        <select
          value={representanteLegalId}
          onChange={(event) => setRepresentanteLegalId(event.target.value)}
          className={CLASSE_CAMPO_UPLOAD_OUTRO}
        >
          <option value="">Agência</option>
          {representantesLegais.map((socio) => (
            <option key={socio.id} value={socio.id}>
              {socio.nome}
            </option>
          ))}
        </select>
      </div>

      {tipo === "OUTROS" ? (
        <input
          type="text"
          name="descricaoOutro"
          required
          placeholder="Descreva o que é este documento"
          className={`${CLASSE_CAMPO_UPLOAD_OUTRO} placeholder:text-muted-foreground`}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
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
          {enviando ? "Enviando..." : "Enviar documento"}
        </button>
      </div>
    </form>
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
export function formatarValorExtraido(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (texto.length === 0) return "—";
    // "NAO_CONSTA" é o valor de status "limpo" da SOFIA (ver varianteSofia
    // em consulta-amat-sofia.tsx) — só o rótulo muda pro analista, o dado
    // gravado no banco continua o token original.
    if (texto.toUpperCase() === "NAO_CONSTA") return "Nada consta";
    return texto;
  }
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
export function CamposDetalhe({
  titulo,
  campos,
}: {
  titulo: string;
  campos: Record<string, unknown>;
}) {
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
          Confiança: {formatarPercentual(analise.confiancaExtracao)}
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

      {analise.parecer === "REPROVADO" ? (
        <p className="text-destructive font-medium">
          IA reprovou — motivo:{" "}
          {analise.resumoAnalise ?? alertas[0]?.mensagem ?? "sem detalhamento registrado."}
        </p>
      ) : analise.resumoAnalise ? (
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

      {/* Marca d'água decorativa no espaço vazio abaixo do parecer —
          reforça visualmente o veredito sem competir com o conteúdo
          (65% de opacidade, decisão do usuário, 2026-07-27). */}
      {IMAGEM_PARECER[analise.parecer ?? ""] ? (
        <div className="flex w-full items-center justify-center py-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- ícone decorativo estático em public/, next/image seria overhead sem ganho aqui */}
          <img
            src={IMAGEM_PARECER[analise.parecer ?? ""]}
            alt=""
            aria-hidden="true"
            className="h-40 w-40 object-contain opacity-65"
          />
        </div>
      ) : null}
    </div>
  );
}

const IMAGEM_PARECER: Record<string, string> = {
  APROVADO: "/parecer/aprovado.png",
  REPROVADO: "/parecer/reprovado.svg",
};

// Rótulo em pt-br pra cada razão estruturada do agents-service (ver
// agency_analysis_reasons.py) — cobre os enums de APROVADO, PENDENTE e
// REPROVADO num só mapa, já que o campo `razoes` pode conter qualquer um
// deles dependendo do parecer. Razão sem entrada aqui (enum novo do lado
// deles, ainda não mapeado) cai no fallback do próprio valor bruto.
const RAZAO_LABELS: Record<string, string> = {
  TUDO_CONFERE: "Tudo confere",
  RISCO_BAIXO: "Risco baixo",
  DOCUMENTO_VENCIDO: "Documento vencido",
  DOCUMENTO_INVALIDO: "Documento inválido",
  DOCUMENTO_FALTANTE: "Documento faltante",
  CNPJ_INATIVO: "CNPJ inativo",
  CNAE_INCOMPATIVEL: "CNAE incompatível",
  DIVERGENCIA_CADASTRAL: "Divergência cadastral",
  DIVERGENCIA_SOCIOS: "Divergência de sócios",
  EMAIL_INVALIDO: "E-mail inválido",
  SOFIA_REGISTRADO: "Registrado no SOFIA",
  PROCESSOS_JUDICIAIS: "Processos judiciais",
  RECLAMACOES_SIGNIFICATIVAS: "Reclamações significativas",
  AMAT_DIVIDA: "Dívida no AMAT",
  AMAT_RESTRICOES: "Restrições no AMAT",
  DADOS_INCOMPLETOS: "Dados incompletos",
  ERRO_PROCESSAMENTO: "Erro de processamento",
  ADMINISTRATIVO_NAO_VALIDADO: "Administrativo não validado",
  DIVERGENCIA_CADASTRAL_CRITICA: "Divergência cadastral crítica",
  DIVERGENCIA_SOCIOS_CRITICA: "Divergência de sócios crítica",
  RISCO_ALTO_DETECTADO: "Risco alto detectado",
  ERRO_CRITICO: "Erro crítico",
};

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
  // Aprovado pela IA já significa que informações e documentação bateram com
  // as regras de aprovação (é por isso que o contrato foi gerado) — mostrar
  // pontosDeAlerta/gruposParaChecar aqui daria a entender que há pendência
  // num cadastro que já passou, mesmo quando o agente registrou alguma
  // inconsistência menor não-bloqueante junto com o veredito de aprovação.
  const precisaRevisao = parecer.resultado !== "APROVADO";

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

      {/* Razões estruturadas (enum) do parecer — diferente de pontosDeAlerta
          (texto livre), sempre mostradas quando existem, mesmo em
          APROVADO (ex.: TUDO_CONFERE, RISCO_BAIXO não são pendência). */}
      {parecer.razoes.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SubsecaoLabel>Razões</SubsecaoLabel>
          <div className="flex flex-wrap gap-1.5">
            {parecer.razoes.map((razao) => (
              <span
                key={razao}
                className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
              >
                {RAZAO_LABELS[razao] ?? razao}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {precisaRevisao && parecer.pontosDeAlerta.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SubsecaoLabel>Pontos de alerta</SubsecaoLabel>
          <ul className="text-warning list-inside list-disc text-xs">
            {parecer.pontosDeAlerta.map((ponto, index) => (
              <li key={index}>{ponto}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {precisaRevisao && parecer.gruposParaChecar.length > 0 ? (
        <div className="flex flex-col gap-3">
          <SubsecaoLabel>O que o analista precisa checar</SubsecaoLabel>
          {parecer.gruposParaChecar.map((grupo) => (
            <div key={grupo.entidadeLabel} className="flex flex-col gap-1.5">
              <span className="text-foreground text-xs font-bold">{grupo.entidadeLabel}</span>
              <span className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase">
                Inconsistências
              </span>
              {grupo.documentos.map((documento) => (
                <div
                  key={documento.tipoLabel}
                  className="border-border bg-muted/30 rounded-lg border px-3 py-2 text-xs"
                >
                  <span className="text-foreground font-semibold">{documento.tipoLabel}</span>
                  <ol className="text-muted-foreground mt-1 list-inside list-decimal">
                    {documento.mensagens.map((mensagem, index) => (
                      <li key={index}>{mensagem}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ))}
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

// Últimos analistas que assumiram o atendimento da agência (não da
// conversa — ver AtendimentoAgencia) — quem, quando assumiu e quando
// liberou (ou "em andamento", se ainda ativo). A tag/trava só mostra quem
// está atendendo agora; o histórico completo (até 10) fica aqui, atrás de
// um <details> (mesmo padrão de HistoricoDocumento acima), pra não sumir
// quando o atendimento é encerrado — decisão do usuário, 2026-07-28.
export function HistoricoAtendimentoAgencia({
  historico,
}: {
  historico: { analistaNome: string; assumidoEm: Date; liberadoEm: Date | null }[];
}) {
  if (historico.length === 0) {
    return (
      <span className="text-muted-foreground text-xs">Nenhum atendimento registrado ainda.</span>
    );
  }

  return (
    <details className="border-border bg-muted/20 rounded-lg border px-3 py-2 text-xs">
      <summary className="text-muted-foreground cursor-pointer font-semibold">
        Histórico de atendimento ({historico.length})
      </summary>
      <div className="mt-2 flex flex-col gap-1.5">
        {historico.map((item, index) => (
          <div
            key={index}
            className="border-border flex flex-wrap items-center justify-between gap-2 border-t pt-1.5 first:border-0 first:pt-0"
          >
            <span className="text-foreground font-medium">{item.analistaNome}</span>
            <span className="text-muted-foreground">
              assumiu em {formatarData(item.assumidoEm)}
              {item.liberadoEm
                ? ` — encerrado em ${formatarData(item.liberadoEm)}`
                : " — em andamento"}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
