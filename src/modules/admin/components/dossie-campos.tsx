import type { ReactNode } from "react";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type {
  DadosReceitaEndereco,
  DadosReceitaCnae,
} from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type { AnaliseIaResumo } from "@/modules/admin/types/dossie.types";
import { alertasVisiveis } from "@/modules/cadastro/utils/alerta-analise.util";
import { VisualizarDocumento } from "@/modules/admin/components/visualizar-documento";

// Blocos de apresentação reaproveitados entre o dossiê do funil
// (/painel/[id]) e o dossiê do arquivo (/arquivo/[id]) — mesma
// "ficha" de Empresa/Receita/Sócios, sem nenhuma regra de negócio
// própria de cada rota.

// Par rótulo/valor reaproveitado em todas as seções — rótulo neutro (a cor
// de marca fica reservada pra ação primária e identidade, não pra rótulo
// estrutural) e valor em destaque.
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
    <div className={className}>
      <dt className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">{label}</dt>
      <dd className="text-foreground mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
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
export function Arquivo({ documento }: { documento: Documento }) {
  const nomeArquivo = documento.gcsPath.split("/").pop() ?? documento.gcsPath;
  return (
    <VisualizarDocumento documentoId={documento.id} gcsPath={documento.gcsPath} label={nomeArquivo}>
      <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-semibold break-all">
        {nomeArquivo}
      </span>
    </VisualizarDocumento>
  );
}

// Documento reprovado sai do rol "oficial" da ficha (Empresa/Sócios) —
// mostra que está faltando reenvio em vez do arquivo que foi rejeitado,
// já que o soft-delete só marca o status, não apaga a linha do banco.
export function CampoDocumento({ documento }: { documento: Documento | null }) {
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

  return <Arquivo documento={documento} />;
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
