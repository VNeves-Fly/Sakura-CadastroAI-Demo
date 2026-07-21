"use client";

import { PAISES_TELEFONE, paisTelefonePorCodigo } from "@/modules/shared/utils/telefone.util";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Passo2EmpresaProps = ReturnType<typeof useCadastroWizardViewModel>;

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props.
export function Passo2Empresa({
  telefoneComercial,
  telefoneComercialPais,
  semTelefoneComercial,
  telefoneComercialInvalido,
  emailOperacional,
  emailComercial,
  emailFinanceiro,
  emailOperacionalInvalido,
  emailComercialInvalido,
  emailFinanceiroInvalido,
  empresaCamposDesbloqueados,
  setTelefoneComercial,
  setTelefoneComercialPais,
  setSemTelefoneComercial,
  setEmailOperacional,
  setEmailComercial,
  setEmailFinanceiro,
  usarEmailOperacionalParaTodos,
}: Passo2EmpresaProps) {
  const paisTelefone = paisTelefonePorCodigo(telefoneComercialPais);
  const bloqueado = !empresaCamposDesbloqueados;

  return (
    <div className="flex flex-col gap-5">
      {bloqueado ? (
        <p className="text-muted-foreground bg-muted/40 rounded-2xl px-4 py-2.5 text-xs">
          Anexe o contrato social acima pra liberar os campos da empresa — a IA usa o que conseguir
          ler dele pra ajudar a preencher.
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-sm font-bold">
          Telefone Comercial
          {semTelefoneComercial ? null : <span className="text-destructive"> *</span>}
        </label>
        <div className="flex gap-2">
          <Select
            value={telefoneComercialPais}
            disabled={bloqueado || semTelefoneComercial}
            onValueChange={(valor) => setTelefoneComercialPais(valor ?? "")}
          >
            <SelectTrigger className="w-[6.5rem] shrink-0 px-2.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAISES_TELEFONE.map((pais) => (
                <SelectItem key={pais.codigo} value={pais.codigo}>
                  {pais.bandeira} {pais.ddi || "Outro"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="tel"
            inputMode="numeric"
            value={telefoneComercial}
            disabled={bloqueado || semTelefoneComercial}
            onChange={(event) => setTelefoneComercial(event.target.value)}
            className={`${INPUT_CLASSNAME} min-w-0 flex-1`}
            placeholder={paisTelefone.placeholder}
          />
        </div>
        {telefoneComercialInvalido ? (
          <span className="text-destructive text-xs font-medium">
            Telefone incompleto para {paisTelefone.nome}.
          </span>
        ) : null}
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={semTelefoneComercial}
            disabled={bloqueado}
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
            disabled={bloqueado}
            className="text-primary text-xs font-semibold hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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
            disabled={bloqueado}
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
            disabled={bloqueado}
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
            disabled={bloqueado}
            onChange={(event) => setEmailFinanceiro(event.target.value)}
            className={INPUT_CLASSNAME}
            placeholder="financeiro@empresa.com"
          />
          {emailFinanceiroInvalido ? (
            <span className="text-destructive text-xs font-medium">E-mail inválido.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
