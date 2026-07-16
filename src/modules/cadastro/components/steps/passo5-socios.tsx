"use client";

import { SocioWizardCard } from "@/modules/cadastro/components/socio-wizard-card";
import { PersonPlusIcon } from "@/modules/cadastro/components/icons";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

type Passo5SociosProps = ReturnType<typeof useCadastroWizardViewModel>;

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props. Sócios vêm pré-preenchidos do QSA
// (Seção Empresa); o representante é só um sócio com a flag marcada.
export function Passo5Socios({
  socios,
  socioCepBuscando,
  addSocio,
  removeSocio,
  updateSocio,
  toggleRepresentante,
  buscarCepSocio,
}: Passo5SociosProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Pré-preenchido a partir da consulta à Receita Federal — confira e complete os dados.
        </p>
        <button
          type="button"
          onClick={addSocio}
          className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <PersonPlusIcon />
          Adicionar sócio
        </button>
      </div>

      {socios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum sócio ainda — complete o CNPJ na Seção Empresa pra pré-preencher automaticamente,
          ou adicione manualmente.
        </div>
      ) : null}

      {socios.map((socio, index) => (
        <SocioWizardCard
          key={index}
          index={index}
          socio={socio}
          podeRemover={socios.length > 1}
          cepBuscando={socioCepBuscando === index}
          onUpdate={(patch) => updateSocio(index, patch)}
          onRemove={() => removeSocio(index)}
          onToggleRepresentante={() => toggleRepresentante(index)}
          onBuscarCep={() => buscarCepSocio(index)}
        />
      ))}
    </div>
  );
}
