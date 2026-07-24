"use client";

import { FileDropInput } from "@/modules/cadastro/components/file-drop-input";
import { AnaliseDocumentoLoading } from "@/modules/cadastro/components/analise-documento-loading";
import {
  PAISES_TELEFONE,
  PAISES_TELEFONE_ITEMS,
  paisTelefonePorCodigo,
} from "@/modules/shared/utils/telefone.util";
import {
  ESTADO_CIVIL_OPCOES,
  ESTADO_CIVIL_OPCOES_ITEMS,
} from "@/modules/cadastro/types/socio-wizard.types";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type {
  SocioWizardFormValues,
  SocioWizardValidacao,
} from "@/modules/cadastro/types/socio-wizard.types";
import type { DocumentoIdentificacaoAnaliseView } from "@/modules/cadastro/types/agencia.types";

interface SocioAnaliseIdentificacaoProps {
  analisando: boolean;
  analise: DocumentoIdentificacaoAnaliseView | null;
}

interface SocioWizardCardProps {
  index: number;
  socio: SocioWizardFormValues;
  validacao: SocioWizardValidacao;
  analiseIdentificacao: SocioAnaliseIdentificacaoProps;
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
  analiseIdentificacao,
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

      <FileDropInput
        label="RG ou CNH"
        accept=".pdf,.jpg,.jpeg,.png"
        file={socio.rgArquivo}
        erro={rgErro}
        onChange={(file) => onUpdate({ rgArquivo: file })}
        helperText="Anexe primeiro — a IA analisa e ajuda a preencher o resto do cadastro"
        disabled={analiseIdentificacao.analisando}
        disabledHelperText="Aguarde a análise do documento terminar..."
        required
      />

      {analiseIdentificacao.analisando ? (
        <AnaliseDocumentoLoading mensagem="Analisando o documento..." />
      ) : null}

      {!socio.rgArquivo ? (
        <p className="text-muted-foreground text-xs">
          Anexe o RG ou CNH do sócio pra liberar o restante do cadastro.
        </p>
      ) : analiseIdentificacao.analisando ? null : (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-foreground text-xs font-bold tracking-wide uppercase">
              Nome completo<span className="text-destructive"> *</span>
            </label>
            <input
              type="text"
              autoComplete="off"
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
                autoComplete="off"
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
                Data de nascimento<span className="text-destructive"> *</span>
              </label>
              <DatePicker
                value={socio.dataNascimento}
                onChange={(valor) => onUpdate({ dataNascimento: valor })}
                disabledDays={{ after: new Date() }}
              />
              {dataNascimentoStatus.mensagem ? (
                <span className="text-destructive text-xs font-medium">
                  {dataNascimentoStatus.mensagem}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-foreground text-xs font-bold tracking-wide uppercase">
                E-mail<span className="text-destructive"> *</span>
              </label>
              <input
                type="email"
                autoComplete="off"
                value={socio.email}
                onChange={(event) => onUpdate({ email: event.target.value })}
                className={INPUT_CLASSNAME}
                placeholder="socio@email.com"
              />
              {emailInvalido ? (
                <span className="text-destructive text-xs font-medium">E-mail inválido.</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-foreground text-xs font-bold tracking-wide uppercase">
                Telefone<span className="text-destructive"> *</span>
              </label>
              <div className="flex gap-2">
                <Select
                  items={PAISES_TELEFONE_ITEMS}
                  value={socio.telefonePais}
                  onValueChange={(valor) => onUpdate({ telefonePais: valor ?? "" })}
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
                  autoComplete="off"
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
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-foreground text-xs font-bold tracking-wide uppercase">
                Número do RG
              </label>
              <input
                type="text"
                autoComplete="off"
                value={socio.rg}
                onChange={(event) => onUpdate({ rg: event.target.value })}
                className={INPUT_CLASSNAME}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-foreground text-xs font-bold tracking-wide uppercase">
                Órgão emissor
              </label>
              <input
                type="text"
                autoComplete="off"
                value={socio.rgOrgaoEmissor}
                onChange={(event) => onUpdate({ rgOrgaoEmissor: event.target.value })}
                className={INPUT_CLASSNAME}
                placeholder="SSP"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-foreground text-xs font-bold tracking-wide uppercase">
                UF do RG
              </label>
              <input
                type="text"
                maxLength={2}
                autoComplete="off"
                value={socio.rgUf}
                onChange={(event) => onUpdate({ rgUf: event.target.value.toUpperCase() })}
                className={INPUT_CLASSNAME}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-foreground text-xs font-bold tracking-wide uppercase">
              Estado Civil<span className="text-destructive"> *</span>
            </label>
            <Select
              items={ESTADO_CIVIL_OPCOES_ITEMS}
              value={socio.estadoCivil}
              onValueChange={(valor) => onUpdate({ estadoCivil: valor ?? "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADO_CIVIL_OPCOES.map((opcao) => (
                  <SelectItem key={opcao.valor} value={opcao.valor}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-foreground text-xs font-bold tracking-wide uppercase">
              CEP<span className="text-destructive"> *</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                autoComplete="off"
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
              autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
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
              autoComplete="off"
              value={socio.cidade}
              onChange={(event) => onUpdate({ cidade: event.target.value })}
              className={INPUT_CLASSNAME}
            />
          </div>

          <label className="text-foreground flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={socio.isRepresentante}
              onChange={onToggleRepresentante}
            />
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
        </>
      )}
    </div>
  );
}
