"use client";

import { FileDropInput } from "@/modules/cadastro/components/file-drop-input";
import { MailIcon } from "@/modules/cadastro/components/icons";
import { validarEmail } from "@/modules/shared/utils/email.util";
import {
  PAISES_TELEFONE,
  paisTelefonePorCodigo,
  validarTelefone,
} from "@/modules/shared/utils/telefone.util";
import type { QsaResultView, SocioFormValues } from "@/modules/cadastro/types/agencia.types";

interface SocioCardProps {
  index: number;
  socio: SocioFormValues;
  podeRemover: boolean;
  qsaResult: QsaResultView | null;
  onUpdate: (patch: Partial<SocioFormValues>) => void;
  onRemove: () => void;
  onSelecionarQsa: (nome: string) => void;
  onAtivarManual: () => void;
}

const OPCAO_MANUAL = "__manual__";
const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30";

export function SocioCard({
  index,
  socio,
  podeRemover,
  qsaResult,
  onUpdate,
  onRemove,
  onSelecionarQsa,
  onAtivarManual,
}: SocioCardProps) {
  const mostrarCombobox = qsaResult !== null && !socio.modoManual;
  const numero = String(index + 1).padStart(2, "0");
  const emailInvalido = socio.email.length > 0 && !validarEmail(socio.email);
  const telefoneInvalido =
    socio.telefone.length > 0 && !validarTelefone(socio.telefone, socio.telefonePais);
  const paisTelefone = paisTelefonePorCodigo(socio.telefonePais);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Sócio {numero}
        </span>
        {podeRemover ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-destructive hover:underline"
          >
            Remover
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-wide text-foreground">
          Nome completo<span className="text-destructive"> *</span>
        </label>

        {mostrarCombobox ? (
          <select
            value={socio.nome}
            onChange={(event) => {
              if (event.target.value === OPCAO_MANUAL) {
                onAtivarManual();
              } else {
                onSelecionarQsa(event.target.value);
              }
            }}
            className={INPUT_CLASSNAME}
          >
            <option value="" disabled>
              Selecione o nome (QSA)
            </option>
            {qsaResult.nomesSocios.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
            <option value={OPCAO_MANUAL}>+ Inserir manualmente</option>
          </select>
        ) : (
          <input
            type="text"
            value={socio.nome}
            onChange={(event) => onUpdate({ nome: event.target.value })}
            className={INPUT_CLASSNAME}
            placeholder="Nome conforme QSA"
          />
        )}

        {socio.qsaStatus === "confirmado" ? (
          <span className="text-xs font-medium text-success">✓ Confirmado no QSA</span>
        ) : null}
        {socio.qsaStatus === "divergente" ? (
          <span className="text-xs font-medium text-destructive">✕ Nome não encontrado</span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            E-mail<span className="text-destructive"> *</span>
          </label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={socio.email}
              onChange={(event) => onUpdate({ email: event.target.value })}
              className={`${INPUT_CLASSNAME} pl-9`}
              placeholder="socio@email.com"
            />
          </div>
          {emailInvalido ? (
            <span className="text-xs font-medium text-destructive">E-mail inválido.</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            Telefone<span className="text-destructive"> *</span>
          </label>
          <div className="flex gap-2">
            <select
              value={socio.telefonePais}
              onChange={(event) => onUpdate({ telefonePais: event.target.value })}
              className="w-[6.5rem] shrink-0 rounded-full border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
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
              value={socio.telefone}
              onChange={(event) => onUpdate({ telefone: event.target.value })}
              className={`${INPUT_CLASSNAME} flex-1`}
              placeholder={paisTelefone.placeholder}
            />
          </div>
          {telefoneInvalido ? (
            <span className="text-xs font-medium text-destructive">
              Telefone incompleto para {paisTelefone.nome}.
            </span>
          ) : null}
        </div>
      </div>

      <FileDropInput
        label="RG ou CNH"
        accept=".pdf,.jpg,.jpeg,.png"
        file={socio.rg}
        onChange={(file) => onUpdate({ rg: file })}
        helperText="Foto ou PDF do documento"
        required
      />
    </div>
  );
}
