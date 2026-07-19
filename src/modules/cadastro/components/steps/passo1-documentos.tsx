"use client";

import { FileDropInput } from "@/modules/cadastro/components/file-drop-input";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

type Passo1DocumentosProps = ReturnType<typeof useCadastroWizardViewModel>;

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props.
export function Passo1Documentos({
  cnpj,
  cnpjStatus,
  qsaChecking,
  avisoAlfanumerico,
  contratoSocial,
  contratoSocialErro,
  analisandoContratoSocial,
  contratoSocialAnalise,
  setContratoSocial,
  setCnpj,
}: Passo1DocumentosProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="cnpj" className="text-foreground text-sm font-bold">
          CNPJ da agência<span className="text-destructive"> *</span>
        </label>
        <input
          id="cnpj"
          type="text"
          value={cnpj}
          onChange={(event) => setCnpj(event.target.value)}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-full border px-4 py-2.5 text-sm outline-none focus:ring-2"
          placeholder="00.000.000/0000-00"
        />

        {qsaChecking ? (
          <span className="text-muted-foreground text-xs">Consultando o CNPJ...</span>
        ) : null}
        {avisoAlfanumerico ? (
          <span className="text-warning text-xs font-medium">
            CNPJ alfanumérico — consulta automática ainda não disponível pra esse formato.
          </span>
        ) : null}
        {!qsaChecking && cnpjStatus.mensagem ? (
          <span className="text-destructive text-xs font-medium">{cnpjStatus.mensagem}</span>
        ) : null}
        {!qsaChecking && cnpjStatus.valido ? (
          <span className="text-success text-xs font-medium">✓ CNPJ válido</span>
        ) : null}
      </div>

      <FileDropInput
        label="Contrato Social da Empresa"
        accept=".pdf,.jpg,.jpeg,.png"
        file={contratoSocial}
        erro={contratoSocialErro}
        onChange={setContratoSocial}
        helperText="Clique para anexar o PDF do contrato social atualizado"
        required
      />

      {analisandoContratoSocial ? (
        <span className="text-muted-foreground text-xs">Analisando o contrato social...</span>
      ) : null}

      {!analisandoContratoSocial && contratoSocialAnalise?.cnpjConfere === false ? (
        <span className="text-destructive text-xs font-medium">
          O CNPJ do contrato social anexado não bate com o CNPJ digitado — confira se é o arquivo
          certo.
        </span>
      ) : null}

      {!analisandoContratoSocial && contratoSocialAnalise?.alertas.length ? (
        <ul className="text-warning flex flex-col gap-0.5 text-xs font-medium">
          {contratoSocialAnalise.alertas.map((alerta) => (
            <li key={alerta}>{alerta}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
