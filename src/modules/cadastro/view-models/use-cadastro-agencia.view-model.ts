"use client";

import { useState } from "react";
import { useCadastroAgenciaStore } from "@/modules/cadastro/stores/cadastro-agencia.store";
import { agenciaAdapter } from "@/modules/cadastro/adapters/agencia.adapter";
import { agenciaService } from "@/modules/cadastro/services/agencia.service";
import {
  isCnpjAlfanumerico,
  maskCnpj,
  unmaskCnpj,
  validarCnpjComMensagem,
} from "@/modules/cadastro/utils/cnpj.util";
import {
  criarSocioVazio,
  type QsaResultView,
  type SocioFormValues,
} from "@/modules/cadastro/types/agencia.types";

interface UseCadastroAgenciaOptions {
  origem: string | null;
}

// Contém as regras de apresentação do Link 1: orquestra Adapter + Service,
// dispara a consulta QSA ao completar o CNPJ e decide o estado de cada
// sócio (confirmado/divergente do QSA), sem conhecer detalhes de HTTP.
export function useCadastroAgenciaViewModel({ origem }: UseCadastroAgenciaOptions) {
  const isSubmitting = useCadastroAgenciaStore((state) => state.isSubmitting);
  const error = useCadastroAgenciaStore((state) => state.error);
  const success = useCadastroAgenciaStore((state) => state.success);
  const duplicado = useCadastroAgenciaStore((state) => state.duplicado);
  const setSubmitting = useCadastroAgenciaStore((state) => state.setSubmitting);
  const setError = useCadastroAgenciaStore((state) => state.setError);
  const setSuccess = useCadastroAgenciaStore((state) => state.setSuccess);
  const setDuplicado = useCadastroAgenciaStore((state) => state.setDuplicado);
  const reset = useCadastroAgenciaStore((state) => state.reset);

  const [cnpj, setCnpjRaw] = useState("");
  const [cnpjStatus, setCnpjStatus] = useState<{ valido: boolean; mensagem: string | null }>({
    valido: false,
    mensagem: null,
  });
  const [qsaChecking, setQsaChecking] = useState(false);
  const [qsaResult, setQsaResult] = useState<QsaResultView | null>(null);
  const [avisoAlfanumerico, setAvisoAlfanumerico] = useState(false);
  const [contratoSocial, setContratoSocial] = useState<File | null>(null);
  const [socios, setSocios] = useState<SocioFormValues[]>([criarSocioVazio()]);

  function reavaliarSocios(resultado: QsaResultView | null) {
    setSocios((atual) =>
      atual.map((socio) => {
        if (!resultado || !socio.nome) {
          return { ...socio, qsaStatus: "idle" };
        }
        const corresponde = agenciaAdapter.socioCorrespondeAoQsa(socio.nome, resultado.nomesSocios);
        return { ...socio, qsaStatus: corresponde ? "confirmado" : "divergente" };
      }),
    );
  }

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
      reavaliarSocios(null);
      return;
    }

    setAvisoAlfanumerico(false);
    setQsaChecking(true);

    try {
      const raw = await agenciaService.consultarQsa(cnpjLimpo);
      const resultado = raw ? agenciaAdapter.toQsaResultView(raw) : null;
      setQsaResult(resultado);
      reavaliarSocios(resultado);
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

  function addSocio() {
    setSocios((atual) => [...atual, criarSocioVazio()]);
  }

  function removeSocio(index: number) {
    setSocios((atual) => atual.filter((_, i) => i !== index));
  }

  function updateSocio(index: number, patch: Partial<SocioFormValues>) {
    setSocios((atual) =>
      atual.map((socio, i) => {
        if (i !== index) return socio;
        const atualizado = { ...socio, ...patch };

        if ("nome" in patch) {
          atualizado.qsaStatus =
            qsaResult && atualizado.nome
              ? agenciaAdapter.socioCorrespondeAoQsa(atualizado.nome, qsaResult.nomesSocios)
                ? "confirmado"
                : "divergente"
              : "idle";
        }

        return atualizado;
      }),
    );
  }

  function selecionarSocioDoQsa(index: number, nomeEscolhido: string) {
    updateSocio(index, { nome: nomeEscolhido, modoManual: false, qsaStatus: "confirmado" });
  }

  function ativarModoManual(index: number) {
    updateSocio(index, { nome: "", modoManual: true, qsaStatus: "idle" });
  }

  const socioValido = (socio: SocioFormValues) =>
    Boolean(
      socio.nome && socio.email && socio.telefone && socio.rg && socio.qsaStatus !== "divergente",
    );

  const canSubmit =
    cnpjStatus.valido &&
    !qsaChecking &&
    contratoSocial !== null &&
    socios.length > 0 &&
    socios.every(socioValido);

  async function submit() {
    if (!canSubmit || !contratoSocial) return;

    reset();
    setSubmitting(true);

    const formData = agenciaAdapter.toSubmitFormData({
      cnpjMascarado: cnpj,
      contratoSocial,
      socios,
      origem,
    });

    const raw = await agenciaService.criarAgencia(formData);
    const resultado = agenciaAdapter.toSubmitResultView(raw);

    setSubmitting(false);

    if (resultado.success) {
      setSuccess(true);
      return;
    }

    if (resultado.duplicado) {
      setDuplicado(true);
      return;
    }

    setError(resultado.error ?? "Não foi possível enviar o cadastro.");
  }

  return {
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
    success,
    duplicado,
    submit,
  };
}
