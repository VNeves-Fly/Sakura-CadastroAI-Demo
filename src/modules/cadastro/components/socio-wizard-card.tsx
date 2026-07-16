"use client";

import { FileDropInput } from "@/modules/cadastro/components/file-drop-input";
import { validarEmail } from "@/modules/shared/utils/email.util";
import {
  PAISES_TELEFONE,
  paisTelefonePorCodigo,
  validarTelefone,
} from "@/modules/shared/utils/telefone.util";
import { validarCpfComMensagem } from "@/modules/cadastro/utils/cpf.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import type { SocioWizardFormValues } from "@/modules/cadastro/types/socio-wizard.types";

interface SocioWizardCardProps {
  index: number;
  socio: SocioWizardFormValues;
  podeRemover: boolean;
  cepBuscando: boolean;
  onUpdate: (patch: Partial<SocioWizardFormValues>) => void;
  onRemove: () => void;
  onToggleRepresentante: () => void;
  onBuscarCep: () => void;
}

const INPUT_CLASSNAME =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30";

export function SocioWizardCard({
  index,
  socio,
  podeRemover,
  cepBuscando,
  onUpdate,
  onRemove,
  onToggleRepresentante,
  onBuscarCep,
}: SocioWizardCardProps) {
  const numero = String(index + 1).padStart(2, "0");
  const cpfStatus = validarCpfComMensagem(socio.cpf);
  const emailInvalido = socio.email.length > 0 && !validarEmail(socio.email);
  const telefoneInvalido =
    socio.telefone.length > 0 && !validarTelefone(socio.telefone, socio.telefonePais);
  const paisTelefone = paisTelefonePorCodigo(socio.telefonePais);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Sócio {numero}
          {socio.isRepresentante ? (
            <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
              Representante
            </span>
          ) : null}
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
        <input
          type="text"
          value={socio.nome}
          onChange={(event) => onUpdate({ nome: event.target.value })}
          className={INPUT_CLASSNAME}
          placeholder="Nome conforme QSA"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            CPF<span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            value={socio.cpf}
            onChange={(event) => onUpdate({ cpf: event.target.value })}
            className={INPUT_CLASSNAME}
            placeholder="000.000.000-00"
          />
          {cpfStatus.mensagem ? (
            <span className="text-xs font-medium text-destructive">{cpfStatus.mensagem}</span>
          ) : null}
          {cpfStatus.valido ? (
            <span className="text-xs font-medium text-success">✓ CPF válido</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            E-mail<span className="text-destructive"> *</span>
          </label>
          <input
            type="email"
            value={socio.email}
            onChange={(event) => onUpdate({ email: event.target.value })}
            className={INPUT_CLASSNAME}
            placeholder="socio@email.com"
          />
          {emailInvalido ? (
            <span className="text-xs font-medium text-destructive">E-mail inválido.</span>
          ) : null}
        </div>
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
            className={`${INPUT_CLASSNAME} min-w-0 flex-1`}
            placeholder={paisTelefone.placeholder}
          />
        </div>
        {telefoneInvalido ? (
          <span className="text-xs font-medium text-destructive">
            Telefone incompleto para {paisTelefone.nome}.
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-wide text-foreground">
          Estado Civil<span className="text-destructive"> *</span>
        </label>
        <select
          value={socio.estadoCivil}
          onChange={(event) => onUpdate({ estadoCivil: event.target.value })}
          className={INPUT_CLASSNAME}
        >
          <option value="" disabled>
            Selecione
          </option>
          {ESTADO_CIVIL_OPCOES.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-wide text-foreground">CEP</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={socio.cep}
            onChange={(event) => onUpdate({ cep: event.target.value })}
            className={`${INPUT_CLASSNAME} min-w-0 flex-1`}
            placeholder="00000-000"
          />
          <button
            type="button"
            onClick={onBuscarCep}
            disabled={cepBuscando}
            className="shrink-0 rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cepBuscando ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-wide text-foreground">
          Logradouro<span className="text-destructive"> *</span>
        </label>
        <input
          type="text"
          value={socio.logradouro}
          onChange={(event) => onUpdate({ logradouro: event.target.value })}
          className={INPUT_CLASSNAME}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            Número
          </label>
          <input
            type="text"
            value={socio.numero}
            onChange={(event) => onUpdate({ numero: event.target.value })}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            Bairro
          </label>
          <input
            type="text"
            value={socio.bairro}
            onChange={(event) => onUpdate({ bairro: event.target.value })}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            UF<span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            maxLength={2}
            value={socio.uf}
            onChange={(event) => onUpdate({ uf: event.target.value.toUpperCase() })}
            className={INPUT_CLASSNAME}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-wide text-foreground">
          Cidade<span className="text-destructive"> *</span>
        </label>
        <input
          type="text"
          value={socio.cidade}
          onChange={(event) => onUpdate({ cidade: event.target.value })}
          className={INPUT_CLASSNAME}
        />
      </div>

      <FileDropInput
        label="RG ou CNH"
        accept=".pdf,.jpg,.jpeg,.png"
        file={socio.rgArquivo}
        onChange={(file) => onUpdate({ rgArquivo: file })}
        helperText="Foto ou PDF do documento"
        required
      />

      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input type="checkbox" checked={socio.isRepresentante} onChange={onToggleRepresentante} />
        Este sócio é o representante legal (procurador)
      </label>

      {socio.isRepresentante ? (
        <FileDropInput
          label="Procuração Válida"
          accept=".pdf,.jpg,.jpeg,.png"
          file={socio.procuracaoArquivo}
          onChange={(file) => onUpdate({ procuracaoArquivo: file })}
          helperText="Analisada por IA no envio final"
          required
        />
      ) : null}
    </div>
  );
}
