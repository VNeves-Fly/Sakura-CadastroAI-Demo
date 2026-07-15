"use client";

import { FileDropInput } from "@/modules/cadastro/components/file-drop-input";
import { SocioCard } from "@/modules/cadastro/components/socio-card";
import { SectionHeader } from "@/modules/cadastro/components/section-header";
import { BriefcaseIcon, PersonPlusIcon } from "@/modules/cadastro/components/icons";
import type { useCadastroAgenciaViewModel } from "@/modules/cadastro/view-models/use-cadastro-agencia.view-model";

type AgenciaFormProps = ReturnType<typeof useCadastroAgenciaViewModel>;

// Componente apenas de renderização: recebe todo o estado e os callbacks
// do ViewModel via props, sem regra de negócio própria.
export function AgenciaForm({
  cnpj,
  cnpjStatus,
  qsaChecking,
  qsaResult,
  avisoAlfanumerico,
  contratoSocial,
  setContratoSocial,
  socios,
  setCnpj,
  addSocio,
  removeSocio,
  updateSocio,
  selecionarSocioDoQsa,
  ativarModoManual,
  canSubmit,
  isSubmitting,
  error,
  submit,
}: AgenciaFormProps) {
  const algumSocioDivergente = socios.some((socio) => socio.qsaStatus === "divergente");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="flex w-full flex-col gap-6"
    >
      <div className="flex flex-col gap-4">
        <SectionHeader>Identificação da Agência</SectionHeader>

        <div className="flex flex-col gap-1">
          <label htmlFor="cnpj" className="text-sm font-bold text-foreground">
            CNPJ da agência<span className="text-destructive"> *</span>
          </label>
          <input
            id="cnpj"
            type="text"
            value={cnpj}
            onChange={(event) => setCnpj(event.target.value)}
            className="rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
            placeholder="00.000.000/0000-00"
          />

          {qsaChecking ? (
            <span className="text-xs text-muted-foreground">
              Consultando QSA na Receita Federal...
            </span>
          ) : null}
          {avisoAlfanumerico ? (
            <span className="text-xs font-medium text-warning">
              CNPJ alfanumérico — consulta automática ainda não disponível pra esse formato.
            </span>
          ) : null}
          {!qsaChecking && cnpjStatus.mensagem ? (
            <span className="text-xs font-medium text-destructive">{cnpjStatus.mensagem}</span>
          ) : null}
          {!qsaChecking && cnpjStatus.valido ? (
            <span className="text-xs font-medium text-success">✓ CNPJ válido</span>
          ) : null}
        </div>

        <FileDropInput
          label="Contrato Social"
          accept=".pdf,.doc,.docx"
          file={contratoSocial}
          onChange={setContratoSocial}
          helperText="Clique para anexar o PDF do contrato social atualizado"
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              1
            </span>
            <h2 className="text-base font-bold text-foreground">Documentos dos sócios</h2>
          </div>

          <button
            type="button"
            onClick={addSocio}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <PersonPlusIcon />
            Adicionar sócio
          </button>
        </div>
        <p className="-mt-2 text-sm text-muted-foreground">RG/CNH de cada sócio</p>

        {algumSocioDivergente ? (
          <div className="rounded-xl bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
            Envio bloqueado — nomes divergentes
          </div>
        ) : null}

        {socios.map((socio, index) => (
          <SocioCard
            key={index}
            index={index}
            socio={socio}
            podeRemover={socios.length > 1}
            qsaResult={qsaResult}
            onUpdate={(patch) => updateSocio(index, patch)}
            onRemove={() => removeSocio(index)}
            onSelecionarQsa={(nome) => selecionarSocioDoQsa(index, nome)}
            onAtivarManual={() => ativarModoManual(index)}
          />
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-sakura-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BriefcaseIcon />
          {isSubmitting ? "IA processando..." : "Cadastrar minha agência"}
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Ambiente seguro · LGPD Compliance
        </span>
      </div>
    </form>
  );
}
