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
import { maskTelefone } from "@/modules/shared/utils/telefone.util";
import { maskCpf } from "@/modules/cadastro/utils/cpf.util";
import { maskCep, unmaskCep } from "@/modules/cadastro/utils/cep.util";
import { cepService } from "@/modules/cadastro/services/cep.service";
import { criarSocioWizardVazio } from "@/modules/cadastro/types/socio-wizard.types";
import type { SocioWizardFormValues } from "@/modules/cadastro/types/socio-wizard.types";
import type { EnderecoBancoFormValues } from "@/modules/cadastro/types/endereco-banco.types";

// Documentos + Empresa (antigos Passo 1 e 2) viraram uma seção só. A
// seção Comercial foi removida e Representação virou uma flag dentro do
// form de Sócios (o procurador é tratado como um sócio, com slot extra
// de procuração) — não é mais uma seção separada.
export const ETAPA_LABELS = ["Empresa", "Sócios", "Endereço & Banco", "Revisão"];

interface UseCadastroWizardOptions {
  origem: string | null;
}

// Orquestra a revelação progressiva das seções (página única, sem
// bloqueio de validação — só no envio final) e a lógica de campos da
// seção Empresa (CNPJ + contrato social + consulta QSA + dados da
// empresa).
export function useCadastroWizardViewModel({ origem }: UseCadastroWizardOptions) {
  const secoesReveladas = useCadastroWizardStore((state) => state.secoesReveladas);
  const avancarSecao = useCadastroWizardStore((state) => state.avancarSecao);
  const setOrigem = useCadastroWizardStore((state) => state.setOrigem);

  const cnpj = useCadastroWizardStore((state) => state.cnpj);
  const cnpjStatus = useCadastroWizardStore((state) => state.cnpjStatus);
  const qsaChecking = useCadastroWizardStore((state) => state.qsaChecking);
  const qsaResult = useCadastroWizardStore((state) => state.qsaResult);
  const avisoAlfanumerico = useCadastroWizardStore((state) => state.avisoAlfanumerico);
  const contratoSocial = useCadastroWizardStore((state) => state.contratoSocial);

  const setCnpjRaw = useCadastroWizardStore((state) => state.setCnpj);
  const setCnpjStatus = useCadastroWizardStore((state) => state.setCnpjStatus);
  const setQsaChecking = useCadastroWizardStore((state) => state.setQsaChecking);
  const setQsaResult = useCadastroWizardStore((state) => state.setQsaResult);
  const setAvisoAlfanumerico = useCadastroWizardStore((state) => state.setAvisoAlfanumerico);
  const setContratoSocial = useCadastroWizardStore((state) => state.setContratoSocial);

  const telefoneComercial = useCadastroWizardStore((state) => state.telefoneComercial);
  const telefoneComercialPais = useCadastroWizardStore((state) => state.telefoneComercialPais);
  const semTelefoneComercial = useCadastroWizardStore((state) => state.semTelefoneComercial);
  const emailOperacional = useCadastroWizardStore((state) => state.emailOperacional);
  const emailComercial = useCadastroWizardStore((state) => state.emailComercial);
  const emailFinanceiro = useCadastroWizardStore((state) => state.emailFinanceiro);

  const setTelefoneComercialRaw = useCadastroWizardStore((state) => state.setTelefoneComercial);
  const setTelefoneComercialPaisRaw = useCadastroWizardStore(
    (state) => state.setTelefoneComercialPais,
  );
  const setSemTelefoneComercial = useCadastroWizardStore((state) => state.setSemTelefoneComercial);
  const setEmailOperacional = useCadastroWizardStore((state) => state.setEmailOperacional);
  const setEmailComercial = useCadastroWizardStore((state) => state.setEmailComercial);
  const setEmailFinanceiro = useCadastroWizardStore((state) => state.setEmailFinanceiro);

  const socios = useCadastroWizardStore((state) => state.socios);
  const socioCepBuscando = useCadastroWizardStore((state) => state.socioCepBuscando);
  const setSocios = useCadastroWizardStore((state) => state.setSocios);
  const setSocioCepBuscando = useCadastroWizardStore((state) => state.setSocioCepBuscando);

  const enderecoBanco = useCadastroWizardStore((state) => state.enderecoBanco);
  const enderecoBancoCepBuscando = useCadastroWizardStore(
    (state) => state.enderecoBancoCepBuscando,
  );
  const setEnderecoBanco = useCadastroWizardStore((state) => state.setEnderecoBanco);
  const setEnderecoBancoCepBuscando = useCadastroWizardStore(
    (state) => state.setEnderecoBancoCepBuscando,
  );

  useEffect(() => {
    setOrigem(origem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origem]);

  // Por padrão só 1 sócio aparece, pré-preenchido com o primeiro nome
  // trazido pela consulta QSA (Seção Empresa) assim que ela resolve —
  // os demais sócios do QSA não são adicionados automaticamente; o
  // usuário inclui mais via "Adicionar sócio". Só roda na primeira vez,
  // pra não sobrescrever edições já feitas.
  useEffect(() => {
    if (qsaResult && socios.length === 0) {
      setSocios([criarSocioWizardVazio(qsaResult.nomesSocios[0] ?? "")]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qsaResult]);

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

  function setTelefoneComercial(valorDigitado: string) {
    setTelefoneComercialRaw(maskTelefone(valorDigitado, telefoneComercialPais));
  }

  function setTelefoneComercialPais(pais: string) {
    setTelefoneComercialPaisRaw(pais);
    setTelefoneComercialRaw(maskTelefone(telefoneComercial, pais));
  }

  function usarEmailOperacionalParaTodos() {
    setEmailComercial(emailOperacional);
    setEmailFinanceiro(emailOperacional);
  }

  function addSocio() {
    setSocios([...socios, criarSocioWizardVazio()]);
  }

  function removeSocio(index: number) {
    setSocios(socios.filter((_, i) => i !== index));
  }

  function updateSocio(index: number, patch: Partial<SocioWizardFormValues>) {
    setSocios(
      socios.map((socio, i) => {
        if (i !== index) return socio;
        const atualizado = { ...socio, ...patch };

        if ("cpf" in patch && patch.cpf !== undefined) {
          atualizado.cpf = maskCpf(patch.cpf);
        }
        if ("telefone" in patch && patch.telefone !== undefined) {
          atualizado.telefone = maskTelefone(patch.telefone, atualizado.telefonePais);
        }
        if ("telefonePais" in patch && patch.telefonePais !== undefined) {
          atualizado.telefone = maskTelefone(atualizado.telefone, patch.telefonePais);
        }
        if ("cep" in patch && patch.cep !== undefined) {
          atualizado.cep = maskCep(patch.cep);
        }

        return atualizado;
      }),
    );
  }

  function toggleRepresentante(index: number) {
    setSocios(
      socios.map((socio, i) => ({
        ...socio,
        isRepresentante: i === index ? !socio.isRepresentante : false,
      })),
    );
  }

  async function buscarCepSocio(index: number) {
    const socio = socios[index];
    if (!socio) return;

    const cepLimpo = unmaskCep(socio.cep);
    if (cepLimpo.length !== 8) return;

    setSocioCepBuscando(index);

    try {
      const endereco = await cepService.buscar(cepLimpo);

      if (endereco) {
        updateSocio(index, {
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          uf: endereco.uf,
        });
      }
    } finally {
      setSocioCepBuscando(null);
    }
  }

  function maskDocumentoFavorecido(valorDigitado: string): string {
    const digitos = valorDigitado.replace(/\D/g, "");
    return digitos.length > 11 ? maskCnpj(digitos) : maskCpf(digitos);
  }

  // Nacional: só dígitos (+ traço do dígito verificador). Internacional:
  // alfanumérico maiúsculo (agências/contas internacionais e IBAN usam letras).
  function formatarContaBancaria(valorDigitado: string, bancoPais: string): string {
    if (bancoPais === "internacional") {
      return valorDigitado.replace(/[^A-Za-z0-9 ]/g, "").toUpperCase();
    }
    return valorDigitado.replace(/[^0-9-]/g, "");
  }

  function updateEnderecoBanco(patch: Partial<EnderecoBancoFormValues>) {
    const atualizado = { ...enderecoBanco, ...patch };

    if ("cep" in patch && patch.cep !== undefined) {
      atualizado.cep = maskCep(patch.cep);
    }

    if ("enderecoMesmoSocio" in patch) {
      if (patch.enderecoMesmoSocio && socios.length === 1) {
        atualizado.socioEnderecoVinculado = 0;
      }
      if (!patch.enderecoMesmoSocio) {
        atualizado.socioEnderecoVinculado = null;
      }
    }

    if ("bancoPais" in patch && patch.bancoPais !== undefined) {
      atualizado.bancoNome = "";
      atualizado.bancoAgencia = formatarContaBancaria(atualizado.bancoAgencia, patch.bancoPais);
      atualizado.bancoConta = formatarContaBancaria(atualizado.bancoConta, patch.bancoPais);
    }

    if ("bancoAgencia" in patch && patch.bancoAgencia !== undefined) {
      atualizado.bancoAgencia = formatarContaBancaria(patch.bancoAgencia, atualizado.bancoPais);
    }

    if ("bancoConta" in patch && patch.bancoConta !== undefined) {
      atualizado.bancoConta = formatarContaBancaria(patch.bancoConta, atualizado.bancoPais);
    }

    if ("favorecidoEhEmpresa" in patch && patch.favorecidoEhEmpresa) {
      atualizado.favorecidoNome = qsaResult?.razaoSocial ?? "";
      atualizado.favorecidoDoc = maskCnpj(unmaskCnpj(cnpj));
    }

    if (
      "favorecidoDoc" in patch &&
      patch.favorecidoDoc !== undefined &&
      !atualizado.favorecidoEhEmpresa
    ) {
      atualizado.favorecidoDoc = maskDocumentoFavorecido(patch.favorecidoDoc);
    }

    setEnderecoBanco(atualizado);
  }

  async function buscarCepEnderecoBanco() {
    const cepLimpo = unmaskCep(enderecoBanco.cep);
    if (cepLimpo.length !== 8) return;

    setEnderecoBancoCepBuscando(true);

    try {
      const endereco = await cepService.buscar(cepLimpo);

      if (endereco) {
        updateEnderecoBanco({
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          uf: endereco.uf,
        });
      }
    } finally {
      setEnderecoBancoCepBuscando(false);
    }
  }

  return {
    secoesReveladas,
    totalEtapas: TOTAL_ETAPAS,
    labels: ETAPA_LABELS,
    avancarSecao,

    cnpj,
    cnpjStatus,
    qsaChecking,
    qsaResult,
    avisoAlfanumerico,
    contratoSocial,
    setCnpj,
    setContratoSocial,

    telefoneComercial,
    telefoneComercialPais,
    semTelefoneComercial,
    emailOperacional,
    emailComercial,
    emailFinanceiro,
    setTelefoneComercial,
    setTelefoneComercialPais,
    setSemTelefoneComercial,
    setEmailOperacional,
    setEmailComercial,
    setEmailFinanceiro,
    usarEmailOperacionalParaTodos,

    socios,
    socioCepBuscando,
    addSocio,
    removeSocio,
    updateSocio,
    toggleRepresentante,
    buscarCepSocio,

    enderecoBanco,
    enderecoBancoCepBuscando,
    updateEnderecoBanco,
    buscarCepEnderecoBanco,
  };
}
