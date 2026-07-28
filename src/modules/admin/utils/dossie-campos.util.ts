import type { DadosReceitaEndereco } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";

// Extraído de dossie-campos.tsx (que é "use client") porque estas funções
// puras precisam ser chamadas direto durante o render de Server Components
// (ex.: cadastros/[id]/page.tsx). Uma função exportada por um módulo "use
// client" vira uma referência opaca (Proxy) quando importada por um Server
// Component — chamável só como componente, nunca como função — então
// precisam morar num módulo sem a diretiva.

// Aceita string além de Date de propósito: entidades de domínio com
// `toJSON()` (ex.: Documento, ver documento.entity.ts) cruzam a fronteira
// Server → Client Component já convertidas pra ISO string pelo React —
// mesmo o tipo declarado dizendo `Date`, o valor real em runtime pode
// chegar como string, e `Intl.DateTimeFormat.format()` quebra com
// "RangeError: Invalid time value" se não normalizar antes.
function paraDate(data: Date | string): Date {
  return data instanceof Date ? data : new Date(data);
}

export function formatarData(data: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    paraDate(data),
  );
}

export function formatarDataCurta(data: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(paraDate(data));
}

export function formatarMoedaBrl(valor: number | null): string {
  if (valor === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

// Confiança de extração da IA vem de 0 a 1 (ex.: 0.98) — o analista
// precisa ver isso como percentual (98%), não como fração.
export function formatarPercentual(valorFracao: number): string {
  return `${Math.round(valorFracao * 100)}%`;
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

// Fundo do Campo de Contrato Social/RG-CNH/Procuração conforme a decisão
// do analista — verde aprovado, vermelho reprovado, amarelo enquanto
// ainda pendente (documento enviado, aguardando revisão em Complementar,
// ver PENDENTE em Arquivo) — decisão do usuário, 2026-07-27. `null`
// (nenhum arquivo enviado ainda) mantém o fundo neutro de sempre.
export function corFundoDocumento(documento: Documento | null): string {
  if (!documento) return "bg-card";
  if (documento.status === "APROVADO") return "bg-success-bg";
  if (documento.status === "REPROVADO") return "bg-destructive-bg";
  return "bg-warning-bg";
}
