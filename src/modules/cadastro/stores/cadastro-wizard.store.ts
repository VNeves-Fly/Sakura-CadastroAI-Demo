import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  QsaResultView,
  ContratoSocialAnaliseView,
} from "@/modules/cadastro/types/agencia.types";
import {
  criarSocioWizardVazio,
  type SocioWizardFormValues,
} from "@/modules/cadastro/types/socio-wizard.types";
import {
  criarEnderecoBancoVazio,
  type EnderecoBancoFormValues,
} from "@/modules/cadastro/types/endereco-banco.types";

export const TOTAL_ETAPAS = 6;

interface CnpjStatus {
  valido: boolean;
  mensagem: string | null;
}

interface CadastroWizardState {
  // Página única com seções empilhadas, reveladas progressivamente —
  // secoesReveladas é quantas seções (a partir da 1) já estão visíveis.
  secoesReveladas: number;
  origem: string | null;
  // Id real do Promotor/Associacao/Evento atribuído ao cadastro (já
  // resolvido, ver ExecutivoResolver) — vem pré-preenchido via
  // querystring (link pessoal de promotor ou link de Evento) ou por
  // seleção manual da pessoa no formulário. Null = nenhuma atribuição.
  executivoId: string | null;
  associacaoId: string | null;
  eventoId: string | null;

  // Seção 1 — Empresa (documentos + dados da empresa)
  cnpj: string;
  cnpjStatus: CnpjStatus;
  qsaChecking: boolean;
  qsaResult: QsaResultView | null;
  avisoAlfanumerico: boolean;
  // Aviso antecipado (não substitui a checagem do submit final) — não é
  // persistido: sempre revalidado contra o CNPJ atual, nunca deve mostrar
  // um aviso "congelado" de uma sessão anterior.
  verificandoCnpjCadastrado: boolean;
  cnpjJaCadastrado: boolean;
  contratoSocial: File | null;
  analisandoContratoSocial: boolean;
  contratoSocialAnalise: ContratoSocialAnaliseView | null;
  // Razão social da empresa — preenchida a partir da análise do contrato
  // social (substitui o que antes vinha do QSA/ReceitaWS).
  razaoSocial: string;

  telefoneComercial: string;
  telefoneComercialPais: string;
  semTelefoneComercial: boolean;
  emailOperacional: string;
  emailComercial: string;
  emailFinanceiro: string;

  // Seção 2 — Sócios (representante é um sócio com flag isRepresentante)
  socios: SocioWizardFormValues[];
  socioCepBuscando: number | null;

  // Seção 3 — Endereço & Banco
  enderecoBanco: EnderecoBancoFormValues;
  enderecoBancoCepBuscando: boolean;

  // Submissão (última seção)
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  precisaRevisaoManual: boolean;
  duplicado: boolean;

  setOrigem: (origem: string | null) => void;
  setExecutivoId: (executivoId: string | null) => void;
  setAssociacaoId: (associacaoId: string | null) => void;
  setEventoId: (eventoId: string | null) => void;
  avancarSecao: () => void;
  setCnpj: (cnpj: string) => void;
  setCnpjStatus: (status: CnpjStatus) => void;
  setQsaChecking: (checking: boolean) => void;
  setQsaResult: (result: QsaResultView | null) => void;
  setAvisoAlfanumerico: (aviso: boolean) => void;
  setVerificandoCnpjCadastrado: (verificando: boolean) => void;
  setCnpjJaCadastrado: (jaCadastrado: boolean) => void;
  setContratoSocial: (file: File | null) => void;
  setAnalisandoContratoSocial: (analisando: boolean) => void;
  setContratoSocialAnalise: (analise: ContratoSocialAnaliseView | null) => void;
  setRazaoSocial: (razaoSocial: string) => void;

  setTelefoneComercial: (telefone: string) => void;
  setTelefoneComercialPais: (pais: string) => void;
  setSemTelefoneComercial: (semTelefone: boolean) => void;
  setEmailOperacional: (email: string) => void;
  setEmailComercial: (email: string) => void;
  setEmailFinanceiro: (email: string) => void;

  setSocios: (
    socios: SocioWizardFormValues[] | ((atual: SocioWizardFormValues[]) => SocioWizardFormValues[]),
  ) => void;
  setSocioCepBuscando: (indice: number | null) => void;

  setEnderecoBanco: (
    dados: EnderecoBancoFormValues | ((atual: EnderecoBancoFormValues) => EnderecoBancoFormValues),
  ) => void;
  setEnderecoBancoCepBuscando: (buscando: boolean) => void;

  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  setPrecisaRevisaoManual: (precisaRevisaoManual: boolean) => void;
  setDuplicado: (duplicado: boolean) => void;
  reset: () => void;
}

// Autosave do rascunho em localStorage — a cada mudança de estado (campo
// digitado, seção avançada), salva o formulário pra não perder o
// progresso se o usuário fechar a aba sem terminar. Arquivos (File) não
// são serializáveis: ficam de fora do que é persistido (partialize),
// então contrato social/RG/procuração precisam ser reanexados se o
// rascunho for restaurado — o resto do formulário volta preenchido.
// Quando o cadastro é enviado com sucesso, o rascunho salvo é limpo (ver
// `submit()` no view-model) porque nesse ponto os dados já estão
// persistidos de verdade no banco.
export const useCadastroWizardStore = create<CadastroWizardState>()(
  persist(
    (set) => ({
      secoesReveladas: 1,
      origem: null,
      executivoId: null,
      associacaoId: null,
      eventoId: null,

      cnpj: "",
      cnpjStatus: { valido: false, mensagem: null },
      qsaChecking: false,
      qsaResult: null,
      avisoAlfanumerico: false,
      verificandoCnpjCadastrado: false,
      cnpjJaCadastrado: false,
      contratoSocial: null,
      analisandoContratoSocial: false,
      contratoSocialAnalise: null,
      razaoSocial: "",

      telefoneComercial: "",
      telefoneComercialPais: "BR",
      semTelefoneComercial: false,
      emailOperacional: "",
      emailComercial: "",
      emailFinanceiro: "",

      socios: [criarSocioWizardVazio()],
      socioCepBuscando: null,

      enderecoBanco: criarEnderecoBancoVazio(),
      enderecoBancoCepBuscando: false,

      isSubmitting: false,
      error: null,
      success: false,
      precisaRevisaoManual: false,
      duplicado: false,

      setOrigem: (origem) => set({ origem }),
      setExecutivoId: (executivoId) => set({ executivoId }),
      setAssociacaoId: (associacaoId) => set({ associacaoId }),
      setEventoId: (eventoId) => set({ eventoId }),

      avancarSecao: () =>
        set((state) => ({ secoesReveladas: Math.min(state.secoesReveladas + 1, TOTAL_ETAPAS) })),

      setCnpj: (cnpj) => set({ cnpj }),
      setCnpjStatus: (cnpjStatus) => set({ cnpjStatus }),
      setQsaChecking: (qsaChecking) => set({ qsaChecking }),
      setQsaResult: (qsaResult) => set({ qsaResult }),
      setAvisoAlfanumerico: (avisoAlfanumerico) => set({ avisoAlfanumerico }),
      setVerificandoCnpjCadastrado: (verificandoCnpjCadastrado) =>
        set({ verificandoCnpjCadastrado }),
      setCnpjJaCadastrado: (cnpjJaCadastrado) => set({ cnpjJaCadastrado }),
      setContratoSocial: (contratoSocial) => set({ contratoSocial }),
      setAnalisandoContratoSocial: (analisandoContratoSocial) => set({ analisandoContratoSocial }),
      setContratoSocialAnalise: (contratoSocialAnalise) => set({ contratoSocialAnalise }),
      setRazaoSocial: (razaoSocial) => set({ razaoSocial }),

      setTelefoneComercial: (telefoneComercial) => set({ telefoneComercial }),
      setTelefoneComercialPais: (telefoneComercialPais) => set({ telefoneComercialPais }),
      setSemTelefoneComercial: (semTelefoneComercial) => set({ semTelefoneComercial }),
      setEmailOperacional: (emailOperacional) => set({ emailOperacional }),
      setEmailComercial: (emailComercial) => set({ emailComercial }),
      setEmailFinanceiro: (emailFinanceiro) => set({ emailFinanceiro }),

      setSocios: (socios) =>
        set((state) => ({ socios: typeof socios === "function" ? socios(state.socios) : socios })),
      setSocioCepBuscando: (socioCepBuscando) => set({ socioCepBuscando }),

      setEnderecoBanco: (enderecoBanco) =>
        set((state) => ({
          enderecoBanco:
            typeof enderecoBanco === "function"
              ? enderecoBanco(state.enderecoBanco)
              : enderecoBanco,
        })),
      setEnderecoBancoCepBuscando: (enderecoBancoCepBuscando) => set({ enderecoBancoCepBuscando }),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      setError: (error) => set({ error }),
      setSuccess: (success) => set({ success }),
      setPrecisaRevisaoManual: (precisaRevisaoManual) => set({ precisaRevisaoManual }),
      setDuplicado: (duplicado) => set({ duplicado }),

      reset: () =>
        set({
          secoesReveladas: 1,
          cnpj: "",
          cnpjStatus: { valido: false, mensagem: null },
          qsaChecking: false,
          qsaResult: null,
          avisoAlfanumerico: false,
          verificandoCnpjCadastrado: false,
          cnpjJaCadastrado: false,
          contratoSocial: null,
          analisandoContratoSocial: false,
          contratoSocialAnalise: null,
          razaoSocial: "",
          telefoneComercial: "",
          telefoneComercialPais: "BR",
          semTelefoneComercial: false,
          emailOperacional: "",
          emailComercial: "",
          emailFinanceiro: "",
          socios: [criarSocioWizardVazio()],
          socioCepBuscando: null,
          enderecoBanco: criarEnderecoBancoVazio(),
          enderecoBancoCepBuscando: false,
          isSubmitting: false,
          error: null,
          success: false,
          precisaRevisaoManual: false,
          duplicado: false,
        }),
    }),
    {
      name: "sakura-cadastro-wizard-draft",
      partialize: (state) => ({
        secoesReveladas: state.secoesReveladas,
        origem: state.origem,
        executivoId: state.executivoId,
        associacaoId: state.associacaoId,
        eventoId: state.eventoId,
        cnpj: state.cnpj,
        cnpjStatus: state.cnpjStatus,
        qsaResult: state.qsaResult,
        avisoAlfanumerico: state.avisoAlfanumerico,
        razaoSocial: state.razaoSocial,
        telefoneComercial: state.telefoneComercial,
        telefoneComercialPais: state.telefoneComercialPais,
        semTelefoneComercial: state.semTelefoneComercial,
        emailOperacional: state.emailOperacional,
        emailComercial: state.emailComercial,
        emailFinanceiro: state.emailFinanceiro,
        // Arquivos não são serializáveis — persiste o resto do sócio e
        // deixa os anexos nulos (usuário reanexa se restaurar o rascunho).
        socios: state.socios.map((socio) => ({
          ...socio,
          rgArquivo: null,
          procuracaoArquivo: null,
        })),
        enderecoBanco: state.enderecoBanco,
      }),
    },
  ),
);
