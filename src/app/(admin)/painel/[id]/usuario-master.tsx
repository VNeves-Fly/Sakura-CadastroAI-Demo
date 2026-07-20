"use client";

import { useState } from "react";
import { UserCog, Copy, Check, ClipboardCopy } from "lucide-react";
import type { RepresentanteLegalDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";
import { SecaoColapsavel } from "./secao-colapsavel";

const INPUT_CLASSNAME =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

interface FormValues {
  nome: string;
  email: string;
  cpf: string;
  rg: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  dataNascimento: string;
  telefone: string;
}

const FORM_VAZIO: FormValues = {
  nome: "",
  email: "",
  cpf: "",
  rg: "",
  rgOrgaoEmissor: "",
  rgUf: "",
  dataNascimento: "",
  telefone: "",
};

const LABEL_CAMPO: Record<keyof FormValues, string> = {
  nome: "Nome completo",
  email: "E-mail",
  cpf: "CPF",
  rg: "RG",
  rgOrgaoEmissor: "Órgão emissor",
  rgUf: "UF",
  dataNascimento: "Data de nascimento",
  telefone: "Telefone",
};

function formatarDataNascimento(data: Date | null): string {
  if (!data) return "";
  return data.toISOString().slice(0, 10);
}

function PillCompletude({ label, presente }: { label: string; presente: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
        presente ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function Campo({
  label,
  name,
  value,
  onChange,
  disabled,
  preenchido,
  copiado,
  onCopy,
  type = "text",
}: {
  label: string;
  name: keyof FormValues;
  value: string;
  onChange: (name: keyof FormValues, value: string) => void;
  disabled: boolean;
  preenchido: boolean;
  copiado: boolean;
  onCopy: () => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`usuario-master-${name}`} className="text-foreground text-xs font-bold">
          {label}
        </label>
        {preenchido ? (
          <span className="text-primary text-[10px] font-medium">● pré-preenchido</span>
        ) : null}
      </div>
      <div className="relative">
        <input
          id={`usuario-master-${name}`}
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(name, event.target.value)}
          className={`${INPUT_CLASSNAME} pr-9`}
        />
        <button
          type="button"
          onClick={onCopy}
          disabled={value.length === 0}
          title="Copiar"
          className="text-muted-foreground hover:text-primary absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

// Sessão "Usuário Master" da etapa de Ativação — o analista escolhe qual
// sócio do dossiê vai receber o login master (dados reais pré-preenchidos:
// nome/e-mail/CPF/telefone) ou preenche do zero pra alguém fora do quadro
// societário. RG/órgão emissor/UF/data de nascimento começam em branco:
// nenhum wizard (/cadastro, /chat) pergunta isso hoje, então não existe
// dado real pra pré-preencher — o analista digita manualmente por ora.
export function UsuarioMaster({
  representantesLegais,
  analistaLogado,
  somenteLeitura = false,
}: {
  representantesLegais: RepresentanteLegalDetalhe[];
  analistaLogado: string;
  // true quando o analista está revendo esta etapa a partir de uma etapa
  // posterior (ver `etapaExibida` na page) — trava a seleção/edição/save,
  // só sobra a leitura (copiar continua liberado, não é uma ação de
  // negócio).
  somenteLeitura?: boolean;
}) {
  const [socioSelecionadoId, setSocioSelecionadoId] = useState<string | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [form, setForm] = useState<FormValues>(FORM_VAZIO);
  const [origemSocio, setOrigemSocio] = useState<FormValues>(FORM_VAZIO);
  const [bloqueado, setBloqueado] = useState(false);
  const [salvo, setSalvo] = useState<{ por: string; em: Date } | null>(null);

  function selecionarSocio(socio: RepresentanteLegalDetalhe) {
    const valores: FormValues = {
      nome: socio.nome,
      email: socio.email,
      cpf: socio.cpf,
      rg: socio.rgNumero ?? "",
      rgOrgaoEmissor: socio.rgOrgaoEmissor ?? "",
      rgUf: "",
      dataNascimento: formatarDataNascimento(socio.dataNascimento),
      telefone: socio.telefone,
    };
    setSocioSelecionadoId(socio.id);
    setModoManual(false);
    setForm(valores);
    setOrigemSocio(valores);
    setBloqueado(false);
    setSalvo(null);
  }

  function selecionarManual() {
    setSocioSelecionadoId(null);
    setModoManual(true);
    setForm(FORM_VAZIO);
    setOrigemSocio(FORM_VAZIO);
    setBloqueado(false);
    setSalvo(null);
  }

  function limpar() {
    setSocioSelecionadoId(null);
    setModoManual(false);
    setForm(FORM_VAZIO);
    setOrigemSocio(FORM_VAZIO);
    setBloqueado(false);
    setSalvo(null);
  }

  // "Pré-preenchido" só é honesto enquanto o valor ainda é exatamente o
  // que veio do sócio na hora da seleção — se o analista editar (ou
  // digitar um campo que o sócio não tinha, como RG/órgão/UF hoje,
  // sempre vazios), a tag some porque deixou de ser um dado extraído.
  function preenchidoAutomaticamente(name: keyof FormValues): boolean {
    const valorOrigem = origemSocio[name];
    return valorOrigem !== "" && form[name] === valorOrigem;
  }

  const [campoCopiado, setCampoCopiado] = useState<string | null>(null);

  async function copiar(texto: string, chave: string) {
    if (!texto) return;
    await navigator.clipboard.writeText(texto);
    setCampoCopiado(chave);
    setTimeout(() => setCampoCopiado((atual) => (atual === chave ? null : atual)), 2000);
  }

  function copiarTudo() {
    const texto = (Object.keys(LABEL_CAMPO) as Array<keyof FormValues>)
      .map((campo) => `${LABEL_CAMPO[campo]}: ${form[campo] || "—"}`)
      .join("\n");
    void copiar(texto, "tudo");
  }

  function atualizarCampo(name: keyof FormValues, value: string) {
    setForm((atual) => ({ ...atual, [name]: value }));
  }

  const formIniciado = socioSelecionadoId !== null || modoManual;
  const todosOsCamposPreenchidos = Object.values(form).every((valor) => valor.trim() !== "");
  const completo = salvo !== null && todosOsCamposPreenchidos;

  return (
    <SecaoColapsavel titulo="Usuário Master" icon={<UserCog className="size-4" />}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Selecione o representante que terá o Login Master (dados puxados do dossiê) ou preencha
          manualmente pra alguém fora do quadro societário.
        </p>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
            completo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
          }`}
        >
          {completo ? "Completo" : "Pendente"}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {representantesLegais.map((socio) => {
          const selecionado = socioSelecionadoId === socio.id;
          return (
            <button
              key={socio.id}
              type="button"
              disabled={somenteLeitura}
              onClick={() => selecionarSocio(socio)}
              className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed ${
                selecionado
                  ? "border-primary bg-primary/5 ring-primary/30 ring-2"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <p className="text-foreground text-sm font-semibold">{socio.nome}</p>
              <p className="text-muted-foreground text-xs">
                CPF: {socio.cpf} · {socio.email}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <PillCompletude label="cpf" presente={socio.cpf.length > 0} />
                <PillCompletude label="email" presente={socio.email.length > 0} />
                <PillCompletude label="telefone" presente={socio.telefone.length > 0} />
                <PillCompletude label="rg" presente={!!socio.rgNumero} />
                <PillCompletude label="nasc" presente={!!socio.dataNascimento} />
              </div>
            </button>
          );
        })}

        <button
          type="button"
          disabled={somenteLeitura}
          onClick={selecionarManual}
          className={`rounded-xl border border-dashed p-3 text-left text-sm transition disabled:cursor-not-allowed ${
            modoManual
              ? "border-primary bg-primary/5 ring-primary/30 ring-2"
              : "border-border text-muted-foreground hover:bg-muted/40"
          }`}
        >
          Preencher manualmente (pessoa fora do quadro societário)
        </button>
      </div>

      {formIniciado ? (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={copiarTudo}
              className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition"
            >
              {campoCopiado === "tudo" ? (
                <Check className="size-3.5" />
              ) : (
                <ClipboardCopy className="size-3.5" />
              )}
              Copiar tudo
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo
              label="Nome completo"
              name="nome"
              value={form.nome}
              onChange={atualizarCampo}
              disabled={bloqueado || somenteLeitura}
              preenchido={preenchidoAutomaticamente("nome")}
              copiado={campoCopiado === "nome"}
              onCopy={() => copiar(form.nome, "nome")}
            />
            <Campo
              label="E-mail"
              name="email"
              value={form.email}
              onChange={atualizarCampo}
              disabled={bloqueado || somenteLeitura}
              preenchido={preenchidoAutomaticamente("email")}
              copiado={campoCopiado === "email"}
              onCopy={() => copiar(form.email, "email")}
              type="email"
            />
            <Campo
              label="CPF"
              name="cpf"
              value={form.cpf}
              onChange={atualizarCampo}
              disabled={bloqueado || somenteLeitura}
              preenchido={preenchidoAutomaticamente("cpf")}
              copiado={campoCopiado === "cpf"}
              onCopy={() => copiar(form.cpf, "cpf")}
            />
            <Campo
              label="Telefone"
              name="telefone"
              value={form.telefone}
              onChange={atualizarCampo}
              disabled={bloqueado || somenteLeitura}
              preenchido={preenchidoAutomaticamente("telefone")}
              copiado={campoCopiado === "telefone"}
              onCopy={() => copiar(form.telefone, "telefone")}
            />
            <Campo
              label="RG"
              name="rg"
              value={form.rg}
              onChange={atualizarCampo}
              disabled={bloqueado || somenteLeitura}
              preenchido={preenchidoAutomaticamente("rg")}
              copiado={campoCopiado === "rg"}
              onCopy={() => copiar(form.rg, "rg")}
            />
            <div className="grid grid-cols-2 gap-2">
              <Campo
                label="Órgão emissor"
                name="rgOrgaoEmissor"
                value={form.rgOrgaoEmissor}
                onChange={atualizarCampo}
                disabled={bloqueado || somenteLeitura}
                preenchido={preenchidoAutomaticamente("rgOrgaoEmissor")}
                copiado={campoCopiado === "rgOrgaoEmissor"}
                onCopy={() => copiar(form.rgOrgaoEmissor, "rgOrgaoEmissor")}
              />
              <Campo
                label="UF"
                name="rgUf"
                value={form.rgUf}
                onChange={atualizarCampo}
                disabled={bloqueado || somenteLeitura}
                preenchido={false}
                copiado={campoCopiado === "rgUf"}
                onCopy={() => copiar(form.rgUf, "rgUf")}
              />
            </div>
            <Campo
              label="Data de nascimento"
              name="dataNascimento"
              value={form.dataNascimento}
              onChange={atualizarCampo}
              disabled={bloqueado || somenteLeitura}
              preenchido={preenchidoAutomaticamente("dataNascimento")}
              copiado={campoCopiado === "dataNascimento"}
              onCopy={() => copiar(form.dataNascimento, "dataNascimento")}
              type="date"
            />
          </div>

          <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
            <strong className="text-foreground">Ainda não salva de verdade:</strong> Usuário Master
            não tem campos de RG/órgão emissor/UF/data de nascimento nem log de auditoria no banco
            hoje — esse estado só vive aqui na tela (some se recarregar a página) e o botão Ativar
            cliente não trava nisso ainda. RG/órgão emissor/UF/data de nascimento também não são
            coletados no formulário ou no chat ainda — por isso começam em branco mesmo escolhendo
            um sócio.
          </div>

          {salvo ? (
            <p className="text-success text-xs font-medium">
              ✓ Salvo por {salvo.por} em {salvo.em.toLocaleString("pt-BR")}
            </p>
          ) : null}

          {!somenteLeitura ? (
            <div className="flex flex-wrap gap-2">
              {bloqueado ? (
                <button
                  type="button"
                  onClick={() => setBloqueado(false)}
                  className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition"
                >
                  Editar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBloqueado(true);
                    setSalvo({ por: analistaLogado, em: new Date() });
                  }}
                  className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
                >
                  Salvar
                </button>
              )}
              <button
                type="button"
                onClick={limpar}
                className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition"
              >
                Limpar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </SecaoColapsavel>
  );
}
