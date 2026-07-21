"use client";

import { ChevronDown } from "lucide-react";
import { FileDropInput } from "@/modules/cadastro/components/file-drop-input";
import { PAISES_TELEFONE, paisTelefonePorCodigo } from "@/modules/shared/utils/telefone.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import type {
  SocioWizardFormValues,
  SocioWizardValidacao,
} from "@/modules/cadastro/types/socio-wizard.types";

interface SocioWizardCardProps {
  index: number;
  socio: SocioWizardFormValues;
  validacao: SocioWizardValidacao;
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
  validacao,
  podeRemover,
  cepBuscando,
  onUpdate,
  onRemove,
  onToggleRepresentante,
  onBuscarCep,
}: SocioWizardCardProps) {
  const numero = String(index + 1).padStart(2, "0");
  const {
    cpfStatus,
    dataNascimentoStatus,
    emailInvalido,
    telefoneInvalido,
    rgErro,
    procuracaoErro,
  } = validacao;
  const paisTelefone = paisTelefonePorCodigo(socio.telefonePais);

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Sócio {numero}
          {socio.isRepresentante ? (
            <span className="bg-primary/15 text-primary ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
              Representante
            </span>
          ) : null}
        </span>
        {podeRemover ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-destructive text-xs font-medium hover:underline"
          >
            Remover
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-xs font-bold tracking-wide uppercase">
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
          <label className="text-foreground text-xs font-bold tracking-wide uppercase">
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
            <span className="text-destructive text-xs font-medium">{cpfStatus.mensagem}</span>
          ) : null}
          {cpfStatus.valido ? (
            <span className="text-success text-xs font-medium">✓ CPF válido</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-xs font-bold tracking-wide uppercase">
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
            <span className="text-destructive text-xs font-medium">E-mail inválido.</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-xs font-bold tracking-wide uppercase">
          Data de nascimento<span className="text-destructive"> *</span>
        </label>
        <input
          type="date"
          value={socio.dataNascimento}
          onChange={(event) => onUpdate({ dataNascimento: event.target.value })}
          className={INPUT_CLASSNAME}
        />
        {dataNascimentoStatus.mensagem ? (
          <span className="text-destructive text-xs font-medium">
            {dataNascimentoStatus.mensagem}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-xs font-bold tracking-wide uppercase">
          Telefone<span className="text-destructive"> *</span>
        </label>
        <div className="flex gap-2">
          <select
            value={socio.telefonePais}
            onChange={(event) => onUpdate({ telefonePais: event.target.value })}
            className="border-input bg-background text-foreground focus:border-primary focus:ring-ring/30 w-[6.5rem] shrink-0 rounded-full border px-2 text-sm outline-none focus:ring-2"
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
          <span className="text-destructive text-xs font-medium">
            Telefone incompleto para {paisTelefone.nome}.
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-xs font-bold tracking-wide uppercase">
          Estado Civil<span className="text-destructive"> *</span>
        </label>
        <div className="relative">
          <select
            value={socio.estadoCivil}
            onChange={(event) => onUpdate({ estadoCivil: event.target.value })}
            className={`w-full appearance-none pr-10 ${INPUT_CLASSNAME}`}
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
          <ChevronDown className="text-muted-foreground pointer-events-none absolute inset-y-0 right-4 my-auto size-4" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-xs font-bold tracking-wide uppercase">
          CEP<span className="text-destructive"> *</span>
        </label>
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
            className="border-input text-foreground hover:bg-accent shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cepBuscando ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-foreground text-xs font-bold tracking-wide uppercase">
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
          <label className="text-foreground text-xs font-bold tracking-wide uppercase">
            Número<span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            value={socio.numero}
            onChange={(event) => onUpdate({ numero: event.target.value })}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-xs font-bold tracking-wide uppercase">
            Bairro<span className="text-destructive"> *</span>
          </label>
          <input
            type="text"
            value={socio.bairro}
            onChange={(event) => onUpdate({ bairro: event.target.value })}
            className={INPUT_CLASSNAME}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-foreground text-xs font-bold tracking-wide uppercase">
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
        <label className="text-foreground text-xs font-bold tracking-wide uppercase">
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
        erro={rgErro}
        onChange={(file) => onUpdate({ rgArquivo: file })}
        helperText="Foto ou PDF do documento"
        required
      />

      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={socio.isRepresentante} onChange={onToggleRepresentante} />
        Este sócio é o representante legal (procurador)
      </label>

      {socio.isRepresentante ? (
        <FileDropInput
          label="Procuração Válida"
          accept=".pdf,.jpg,.jpeg,.png"
          file={socio.procuracaoArquivo}
          erro={procuracaoErro}
          onChange={(file) => onUpdate({ procuracaoArquivo: file })}
          helperText="Analisada por IA no envio final"
          required
        />
      ) : null}
    </div>
  );
}
