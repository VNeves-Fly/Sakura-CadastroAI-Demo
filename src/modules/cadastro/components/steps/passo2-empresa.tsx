"use client";

import {
  PAISES_TELEFONE,
  paisTelefonePorCodigo,
  validarTelefone,
} from "@/modules/shared/utils/telefone.util";
import { validarEmail } from "@/modules/shared/utils/email.util";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

type Passo2EmpresaProps = ReturnType<typeof useCadastroWizardViewModel>;

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props.
export function Passo2Empresa({
  qsaResult,
  telefoneComercial,
  telefoneComercialPais,
  semTelefoneComercial,
  emailOperacional,
  emailComercial,
  emailFinanceiro,
  setTelefoneComercial,
  setTelefoneComercialPais,
  setSemTelefoneComercial,
  setEmailOperacional,
  setEmailComercial,
  setEmailFinanceiro,
  usarEmailOperacionalParaTodos,
}: Passo2EmpresaProps) {
  const paisTelefone = paisTelefonePorCodigo(telefoneComercialPais);
  const telefoneInvalido =
    telefoneComercial.length > 0 && !validarTelefone(telefoneComercial, telefoneComercialPais);
  const emailOperacionalInvalido = emailOperacional.length > 0 && !validarEmail(emailOperacional);
  const emailComercialInvalido = emailComercial.length > 0 && !validarEmail(emailComercial);
  const emailFinanceiroInvalido = emailFinanceiro.length > 0 && !validarEmail(emailFinanceiro);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-foreground text-sm font-bold">
          Telefone Comercial
          {semTelefoneComercial ? null : <span className="text-destructive"> *</span>}
        </label>
        <div className="flex gap-2">
          <select
            value={telefoneComercialPais}
            disabled={semTelefoneComercial}
            onChange={(event) => setTelefoneComercialPais(event.target.value)}
            className="border-input bg-background text-foreground focus:border-primary focus:ring-ring/30 w-[6.5rem] shrink-0 rounded-full border px-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PAISES_TELEFONE.map((pais) => (
              <option key={pais.codigo} value={pais.codigo}>
                {pais.bandeira} {pais.ddi || "Outro"}
              </option>
            ))}
          </select>
          <input
            type="tel"
            inputMode="numeric"
            value={telefoneComercial}
            disabled={semTelefoneComercial}
            onChange={(event) => setTelefoneComercial(event.target.value)}
            className={`${INPUT_CLASSNAME} min-w-0 flex-1`}
            placeholder={paisTelefone.placeholder}
          />
        </div>
        {telefoneInvalido ? (
          <span className="text-destructive text-xs font-medium">
            Telefone incompleto para {paisTelefone.nome}.
          </span>
        ) : null}
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={semTelefoneComercial}
            onChange={(event) => setSemTelefoneComercial(event.target.checked)}
          />
          Não possui telefone comercial
        </label>
      </div>

      <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            E-mails
          </span>
          <button
            type="button"
            onClick={usarEmailOperacionalParaTodos}
            className="text-primary text-xs font-semibold hover:underline"
          >
            Usar o mesmo para todos
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-bold">
            E-mail responsável operacional
          </label>
          <input
            type="email"
            value={emailOperacional}
            onChange={(event) => setEmailOperacional(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="operacional@empresa.com"
          />
          {emailOperacionalInvalido ? (
            <span className="text-destructive text-xs font-medium">E-mail inválido.</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-bold">E-mail setor comercial</label>
          <input
            type="email"
            value={emailComercial}
            onChange={(event) => setEmailComercial(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="comercial@empresa.com"
          />
          {emailComercialInvalido ? (
            <span className="text-destructive text-xs font-medium">E-mail inválido.</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-bold">E-mail setor financeiro</label>
          <input
            type="email"
            value={emailFinanceiro}
            onChange={(event) => setEmailFinanceiro(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="financeiro@empresa.com"
          />
          {emailFinanceiroInvalido ? (
            <span className="text-destructive text-xs font-medium">E-mail inválido.</span>
          ) : null}
        </div>
      </div>

      {qsaResult ? (
        <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4">
          <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            Dados da Receita Federal
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ReceitaCampo label="Data de Abertura" valor={qsaResult.dataAbertura} />
            <ReceitaCampo label="Telefone" valor={qsaResult.telefoneReceita} />
            <ReceitaCampo label="E-mail" valor={qsaResult.emailReceita} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReceitaCampo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
        {label}
      </span>
      <div className="border-border bg-muted text-foreground flex flex-col gap-1.5 rounded-2xl border px-4 py-2.5 text-sm">
        <span className="break-words">{valor}</span>
        <span className="bg-success/15 text-success w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
          Recebido
        </span>
      </div>
    </div>
  );
}
