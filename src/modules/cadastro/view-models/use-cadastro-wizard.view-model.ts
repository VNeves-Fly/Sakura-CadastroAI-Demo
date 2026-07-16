"use client";

import { useEffect } from "react";
import {
  useCadastroWizardStore,
  TOTAL_ETAPAS,
} from "@/modules/cadastro/stores/cadastro-wizard.store";
import { agenciaAdapter } from "@/modules/cadastro/adapters/agencia.adapter";
import { agenciaService } from "@/modules/cadastro/services/agencia.service";
import {
  isCnpjAlfanumerico,
  maskCnpj,
  unmaskCnpj,
  validarCnpjComMensagem,
} from "@/modules/cadastro/utils/cnpj.util";

export const ETAPA_LABELS = [
  "Documentos",
  "Empresa",
  "Comercial",
  "Representação",
  "Sócios",
  "Endereço & Banco",
  "Revisão",
];

interface UseCadastroWizardOptions {
  origem: string | null;
}

// Orquestra navegação entre os 7 passos (livre, sem bloqueio — a validação
// de obrigatórios só acontece no envio final) e a lógica do Passo 1
// (CNPJ + contrato social + CADASTUR + consulta QSA).
export function useCadastroWizardViewModel({ origem }: UseCadastroWizardOptions) {
  const etapaAtual = useCadastroWizardStore((state) => state.etapaAtual);
  const maiorEtapaAlcancada = useCadastroWizardStore((state) => state.maiorEtapaAlcancada);
  const irParaEtapa = useCadastroWizardStore((state) => state.irParaEtapa);
  const proximaEtapa = useCadastroWizardStore((state) => state.proximaEtapa);
  const etapaAnterior = useCadastroWizardStore((state) => state.etapaAnterior);
  const setOrigem = useCadastroWizardStore((state) => state.setOrigem);

  const cnpj = useCadastroWizardStore((state) => state.cnpj);
  const cnpjStatus = useCadastroWizardStore((state) => state.cnpjStatus);
  const qsaChecking = useCadastroWizardStore((state) => state.qsaChecking);
  const qsaResult = useCadastroWizardStore((state) => state.qsaResult);
  const avisoAlfanumerico = useCadastroWizardStore((state) => state.avisoAlfanumerico);
  const contratoSocial = useCadastroWizardStore((state) => state.contratoSocial);
  const cadastur = useCadastroWizardStore((state) => state.cadastur);

  const setCnpjRaw = useCadastroWizardStore((state) => state.setCnpj);
  const setCnpjStatus = useCadastroWizardStore((state) => state.setCnpjStatus);
  const setQsaChecking = useCadastroWizardStore((state) => state.setQsaChecking);
  const setQsaResult = useCadastroWizardStore((state) => state.setQsaResult);
  const setAvisoAlfanumerico = useCadastroWizardStore((state) => state.setAvisoAlfanumerico);
  const setContratoSocial = useCadastroWizardStore((state) => state.setContratoSocial);
  const setCadastur = useCadastroWizardStore((state) => state.setCadastur);

  useEffect(() => {
    setOrigem(origem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origem]);

  async function consultarQsaSeCompleto(cnpjMascarado: string) {
    const cnpjLimpo = unmaskCnpj(cnpjMascarado);

    if (cnpjLimpo.length < 14) {
      setQsaResult(null);
      setAvisoAlfanumerico(false);
      return;
    }

    if (isCnpjAlfanumerico(cnpjLimpo)) {
      setAvisoAlfanumerico(true);
      setQsaResult(null);
      return;
    }

    setAvisoAlfanumerico(false);
    setQsaChecking(true);

    try {
      const raw = await agenciaService.consultarQsa(cnpjLimpo);
      setQsaResult(raw ? agenciaAdapter.toQsaResultView(raw) : null);
    } finally {
      setQsaChecking(false);
    }
  }

  function setCnpj(valorDigitado: string) {
    const mascarado = maskCnpj(valorDigitado);
    setCnpjRaw(mascarado);
    setCnpjStatus(validarCnpjComMensagem(mascarado));
    void consultarQsaSeCompleto(mascarado);
  }

  return {
    etapaAtual,
    totalEtapas: TOTAL_ETAPAS,
    maiorEtapaAlcancada,
    labels: ETAPA_LABELS,
    irParaEtapa,
    proximaEtapa,
    etapaAnterior,

    cnpj,
    cnpjStatus,
    qsaChecking,
    qsaResult,
    avisoAlfanumerico,
    contratoSocial,
    cadastur,
    setCnpj,
    setContratoSocial,
    setCadastur,
  };
}
