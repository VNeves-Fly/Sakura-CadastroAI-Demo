"use client";

import { SocioWizardCard } from "@/modules/cadastro/components/socio-wizard-card";
import { PersonPlusIcon } from "@/modules/cadastro/components/icons";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import type { SocioWizardValidacao } from "@/modules/cadastro/types/socio-wizard.types";

type Passo5SociosProps = ReturnType<typeof useCadastroWizardViewModel>;

// sociosValidacao é sempre calculado a partir do mesmo array de socios
// (mesmo tamanho); o fallback só existe pra satisfazer o tipo.
const VALIDACAO_VAZIA: SocioWizardValidacao = {
  cpfStatus: { valido: false, mensagem: null },
  dataNascimentoStatus: { valido: false, mensagem: null },
  emailInvalido: false,
  telefoneInvalido: false,
  rgErro: null,
  procuracaoErro: null,
};

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props. Sócios vêm pré-preenchidos do QSA
// (Seção Empresa); o representante é só um sócio com a flag marcada.
const ANALISE_IDENTIFICACAO_VAZIA = { analisando: false, analise: null };

export function Passo5Socios({
  socios,
  sociosValidacao,
  sociosAnaliseIdentificacao,
  socioCepBuscando,
  addSocio,
  removeSocio,
  updateSocio,
  toggleRepresentante,
  buscarCepSocio,
}: Passo5SociosProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground min-w-0 flex-1 text-sm">
          Preencha os dados do sócio — assim que a consulta à Receita Federal resolver, o nome é
          pré-preenchido automaticamente.
        </p>
        <button
          type="button"
          onClick={addSocio}
          className="text-primary flex shrink-0 items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          <PersonPlusIcon />
          Adicionar sócio
        </button>
      </div>

      {socios.map((socio, index) => (
        <SocioWizardCard
          key={index}
          index={index}
          socio={socio}
          validacao={sociosValidacao[index] ?? VALIDACAO_VAZIA}
          analiseIdentificacao={sociosAnaliseIdentificacao[index] ?? ANALISE_IDENTIFICACAO_VAZIA}
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
