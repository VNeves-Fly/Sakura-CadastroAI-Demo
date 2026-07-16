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
  setContratoSocial,
  cadastur,
  setCadastur,
  setCnpj,
}: Passo1DocumentosProps) {
  return (
    <div className="flex flex-col gap-5">
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
        label="Contrato Social da Empresa"
        accept=".pdf,.jpg,.jpeg,.png"
        file={contratoSocial}
        onChange={setContratoSocial}
        helperText="Clique para anexar o PDF do contrato social atualizado"
        required
      />

      <FileDropInput
        label="Certificado CADASTUR"
        accept=".pdf,.jpg,.jpeg,.png"
        file={cadastur}
        onChange={setCadastur}
        helperText="Opcional — acelera a análise se você já tiver o CADASTUR"
      />
    </div>
  );
}
