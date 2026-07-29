"use client";

import { useState } from "react";
import { Copy, Check, Building2 } from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";

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

interface DadosEmpresaSecaoProps {
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
}

// Cópia dos dados já coletados na ficha, no formato que o TravelLink
// (plataforma externa, sem integração) pede, pra o analista usar de cola
// ao cadastrar manualmente por lá.
export function DadosEmpresaSecao({
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
}: DadosEmpresaSecaoProps) {
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

  return (
    <SecaoColapsavel
      titulo="Dados da empresa"
      icon={<Building2 className="size-4" />}
      defaultAberta={false}
    >
      <div className="flex flex-col gap-4">
        {blocos.map((bloco) => (
          <Bloco key={bloco.titulo} titulo={bloco.titulo} campos={bloco.campos} />
        ))}

        <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
          <strong className="text-foreground">Valores padrão no TravelLink</strong> (não vêm da
          ficha, é só pra lembrar): Bloqueado = S, Tipo de pagamento = PIX.
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void copiarTudo()}
            className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
          >
            {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copiado ? "Copiado!" : "Copiar tudo"}
          </button>
        </div>
      </div>
    </SecaoColapsavel>
  );
}
