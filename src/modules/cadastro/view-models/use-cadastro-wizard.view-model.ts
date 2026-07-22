"use client";

import { useEffect, useRef, useState } from "react";
import {
  useCadastroWizardStore,
  TOTAL_ETAPAS,
} from "@/modules/cadastro/stores/cadastro-wizard.store";
import { agenciaAdapter } from "@/modules/cadastro/adapters/agencia.adapter";
import { cepAdapter } from "@/modules/cadastro/adapters/cep.adapter";
import { agenciaService } from "@/modules/cadastro/services/agencia.service";
import {
  isCnpjAlfanumerico,
  maskCnpj,
  unmaskCnpj,
  validarCnpjComMensagem,
} from "@/modules/cadastro/utils/cnpj.util";
import { maskTelefone, validarTelefone } from "@/modules/shared/utils/telefone.util";
import { validarEmail } from "@/modules/shared/utils/email.util";
import { maskCpf, validarCpfComMensagem } from "@/modules/cadastro/utils/cpf.util";
import { validarDataNascimentoComMensagem } from "@/modules/cadastro/utils/data-nascimento.util";
import { maskCep } from "@/modules/cadastro/utils/cep.util";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";
import { cepService } from "@/modules/cadastro/services/cep.service";
import { criarSocioWizardVazio } from "@/modules/cadastro/types/socio-wizard.types";
import type {
  SocioWizardFormValues,
  SocioWizardValoresExtraidosIa,
} from "@/modules/cadastro/types/socio-wizard.types";
import type { EnderecoBancoFormValues } from "@/modules/cadastro/types/endereco-banco.types";
import type { DocumentoIdentificacaoAnaliseView } from "@/modules/cadastro/types/agencia.types";

interface SocioAnaliseIdentificacaoState {
  analisando: boolean;
  analise: DocumentoIdentificacaoAnaliseView | null;
}

const VALORES_EXTRAIDOS_IA_VAZIO: SocioWizardValoresExtraidosIa = {
  nome: null,
  cpf: null,
  dataNascimento: null,
  rg: null,
  rgOrgaoEmissor: null,
  rgUf: null,
  endereco: null,
};

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
  const analisandoContratoSocial = useCadastroWizardStore(
    (state) => state.analisandoContratoSocial,
  );
  const contratoSocialAnalise = useCadastroWizardStore((state) => state.contratoSocialAnalise);

  const setCnpjRaw = useCadastroWizardStore((state) => state.setCnpj);
  const setCnpjStatus = useCadastroWizardStore((state) => state.setCnpjStatus);
  const setQsaChecking = useCadastroWizardStore((state) => state.setQsaChecking);
  const setQsaResult = useCadastroWizardStore((state) => state.setQsaResult);
  const setAvisoAlfanumerico = useCadastroWizardStore((state) => state.setAvisoAlfanumerico);
  const setContratoSocialRaw = useCadastroWizardStore((state) => state.setContratoSocial);
  const setAnalisandoContratoSocial = useCadastroWizardStore(
    (state) => state.setAnalisandoContratoSocial,
  );
  const setContratoSocialAnalise = useCadastroWizardStore(
    (state) => state.setContratoSocialAnalise,
  );

  // Erros de validação de arquivo (regra em arquivo-upload.util.ts,
  // compartilhada com a validação real do backend) — vivem aqui, não nos
  // componentes de upload, que só exibem o que o ViewModel decidir.
  const [contratoSocialErro, setContratoSocialErro] = useState<string | null>(null);
  const [sociosArquivoErros, setSociosArquivoErros] = useState<
    Record<number, { rg: string | null; procuracao: string | null }>
  >({});
  const [sociosAnaliseIdentificacao, setSociosAnaliseIdentificacao] = useState<
    Record<number, SocioAnaliseIdentificacaoState>
  >({});
  // Valores brutos que a IA extraiu (RG/CNH + contrato social) por sócio —
  // nunca é a fonte de verdade do formulário, só serve pra sinalizar
  // divergência quando o usuário digita algo diferente (ver
  // divergencia-ia.util.ts, usado pelo SocioWizardCard).
  const [sociosValoresExtraidosIa, setSociosValoresExtraidosIa] = useState<
    Record<number, SocioWizardValoresExtraidosIa>
  >({});

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

  const isSubmitting = useCadastroWizardStore((state) => state.isSubmitting);
  const submitError = useCadastroWizardStore((state) => state.error);
  const submitSuccess = useCadastroWizardStore((state) => state.success);
  const submitPrecisaRevisaoManual = useCadastroWizardStore((state) => state.precisaRevisaoManual);
  const submitDuplicado = useCadastroWizardStore((state) => state.duplicado);
  const setSubmitting = useCadastroWizardStore((state) => state.setSubmitting);
  const setSubmitError = useCadastroWizardStore((state) => state.setError);
  const setSubmitSuccess = useCadastroWizardStore((state) => state.setSuccess);
  const setSubmitPrecisaRevisaoManual = useCadastroWizardStore(
    (state) => state.setPrecisaRevisaoManual,
  );
  const setSubmitDuplicado = useCadastroWizardStore((state) => state.setDuplicado);

  // "analisando" cobre toda a espera pós-clique em Enviar (reconsulta QSA,
  // análise de documentos pela IA, geração do contrato); "aprovado"/"revisao"
  // é o desfecho final — fica exibido (sem trocar pra nenhuma outra tela por
  // trás, que seria uma segunda mensagem redundante). A duração mínima de
  // "analisando" vale pra QUALQUER desfecho (sucesso, duplicado ou erro) —
  // sem isso, uma resposta rápida do servidor (ex: erro de validação em <1s)
  // fazia a animação sumir quase instantaneamente.
  const [faseSubmit, setFaseSubmit] = useState<"idle" | "analisando" | "aprovado" | "revisao">(
    "idle",
  );
  const inicioAnaliseRef = useRef<number | null>(null);

  const DURACAO_MINIMA_ANALISE_MS = 10000;

  async function aguardarDuracaoMinimaAnalise() {
    const decorrido = Date.now() - (inicioAnaliseRef.current ?? Date.now());
    const restante = Math.max(0, DURACAO_MINIMA_ANALISE_MS - decorrido);

    if (restante > 0) {
      await new Promise((resolve) => setTimeout(resolve, restante));
    }
  }

  useEffect(() => {
    setOrigem(origem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origem]);

  // Quando a consulta QSA resolve, a Receita já trouxe todos os sócios da
  // empresa — pré-preenchemos um card pra cada nome (o usuário só
  // complementa CPF/e-mail/telefone/endereço/RG), em vez de exigir
  // "Adicionar sócio" manualmente pra cada um. Nunca sobrescreve nome já
  // preenchido nem remove sócio adicionado a mais pelo usuário.
  useEffect(() => {
    if (!qsaResult) return;

    const atualizados = [...socios];
    qsaResult.nomesSocios.forEach((nome, index) => {
      if (!atualizados[index]) {
        atualizados[index] = criarSocioWizardVazio();
      }
      if (!atualizados[index].nome) {
        atualizados[index] = { ...atualizados[index], nome };
      }
    });
    setSocios(atualizados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qsaResult]);

  // Quando a análise do contrato social resolve, tenta preencher um card
  // de sócio pra cada nome extraído (e o endereço, se o contrato social
  // trouxer — MEI às vezes não tem) — mesma regra não-destrutiva da QSA
  // (nunca sobrescreve nome/endereço já preenchidos nem remove sócio
  // adicionado a mais pelo usuário). Também guarda o valor bruto extraído
  // em sociosValoresExtraidosIa, pra sinalizar divergência depois.
  useEffect(() => {
    if (!contratoSocialAnalise) return;

    const atualizados = [...socios];
    contratoSocialAnalise.socios.forEach((socioExtraido, index) => {
      if (!atualizados[index]) {
        atualizados[index] = criarSocioWizardVazio();
      }
      if (!atualizados[index].nome) {
        atualizados[index] = { ...atualizados[index], nome: socioExtraido.nome };
      }
      const endereco = socioExtraido.endereco;
      if (endereco) {
        const semEnderecoAinda =
          !atualizados[index].logradouro && !atualizados[index].cep && !atualizados[index].cidade;
        if (semEnderecoAinda) {
          atualizados[index] = {
            ...atualizados[index],
            cep: endereco.cep ? maskCep(endereco.cep) : atualizados[index].cep,
            logradouro: endereco.logradouro ?? atualizados[index].logradouro,
            numero: endereco.numero ?? atualizados[index].numero,
            bairro: endereco.bairro ?? atualizados[index].bairro,
            cidade: endereco.cidade ?? atualizados[index].cidade,
            uf: endereco.uf ?? atualizados[index].uf,
          };
        }
      }
    });
    setSocios(atualizados);

    setSociosValoresExtraidosIa((atual) => {
      const proximo = { ...atual };
      contratoSocialAnalise.socios.forEach((socioExtraido, index) => {
        proximo[index] = {
          ...(proximo[index] ?? VALORES_EXTRAIDOS_IA_VAZIO),
          nome: socioExtraido.nome,
          endereco: socioExtraido.endereco,
        };
      });
      return proximo;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoSocialAnalise]);

  async function analisarContratoSocialSeCompleto(cnpjMascarado: string, arquivo: File | null) {
    if (!arquivo) return;

    const cnpjLimpo = agenciaAdapter.toQsaConsultaInput(cnpjMascarado);
    if (!validarCnpjComMensagem(cnpjMascarado).valido || isCnpjAlfanumerico(cnpjLimpo)) {
      return;
    }

    setAnalisandoContratoSocial(true);
    setContratoSocialAnalise(null);

    try {
      const formData = agenciaAdapter.toAnalisarContratoSocialFormData({
        cnpjMascarado,
        contratoSocial: arquivo,
      });
      const raw = await agenciaService.analisarContratoSocial(formData);
      setContratoSocialAnalise(agenciaAdapter.toContratoSocialAnaliseView(raw));
    } catch {
      // Best-effort — falha na análise não deve travar o preenchimento manual.
      setContratoSocialAnalise(null);
    } finally {
      setAnalisandoContratoSocial(false);
    }
  }

  // Análise "preview" do RG/CNH do sócio, disparada assim que o arquivo é
  // anexado (Passo 5) — mesmo padrão de analisarContratoSocialSeCompleto.
  // cnpjMascarado é sempre recebido por parâmetro (nunca lido do `cnpj` do
  // closure): setCnpj precisa re-disparar a análise de todos os sócios já
  // anexados usando o CNPJ recém-digitado, antes desse valor ter passado
  // por um novo render.
  async function analisarDocumentoIdentificacaoSeCompleto(
    cnpjMascarado: string,
    indice: number,
    arquivo: File | null,
  ) {
    if (!arquivo) return;

    const cnpjLimpo = agenciaAdapter.toQsaConsultaInput(cnpjMascarado);
    if (!validarCnpjComMensagem(cnpjMascarado).valido || isCnpjAlfanumerico(cnpjLimpo)) {
      return;
    }

    setSociosAnaliseIdentificacao((atual) => ({
      ...atual,
      [indice]: { analisando: true, analise: null },
    }));

    try {
      const formData = agenciaAdapter.toAnalisarDocumentoIdentificacaoFormData({
        cnpjMascarado,
        indice,
        documento: arquivo,
      });
      const raw = await agenciaService.analisarDocumentoIdentificacao(formData);
      const analise = agenciaAdapter.toDocumentoIdentificacaoAnaliseView(raw);

      setSociosAnaliseIdentificacao((atual) => ({
        ...atual,
        [indice]: { analisando: false, analise },
      }));

      // Nunca sobrescreve o que o usuário já digitou — mesma regra
      // não-destrutiva do preenchimento de nome via QSA/contrato social.
      setSocios((current) =>
        current.map((socio, i) => {
          if (i !== indice) return socio;
          const atualizado = { ...socio };
          if (analise.nome && !atualizado.nome) atualizado.nome = analise.nome;
          if (analise.cpf && !atualizado.cpf) atualizado.cpf = maskCpf(analise.cpf);
          if (analise.dataNascimento && !atualizado.dataNascimento) {
            atualizado.dataNascimento = analise.dataNascimento;
          }
          if (analise.rg && !atualizado.rg) atualizado.rg = analise.rg;
          if (analise.rgOrgaoEmissor && !atualizado.rgOrgaoEmissor) {
            atualizado.rgOrgaoEmissor = analise.rgOrgaoEmissor;
          }
          if (analise.rgUf && !atualizado.rgUf) atualizado.rgUf = analise.rgUf;
          return atualizado;
        }),
      );

      setSociosValoresExtraidosIa((atual) => ({
        ...atual,
        [indice]: {
          ...(atual[indice] ?? VALORES_EXTRAIDOS_IA_VAZIO),
          cpf: analise.cpf,
          dataNascimento: analise.dataNascimento,
          rg: analise.rg,
          rgOrgaoEmissor: analise.rgOrgaoEmissor,
          rgUf: analise.rgUf,
        },
      }));
    } catch {
      // Best-effort — falha na análise não deve travar o preenchimento manual.
      setSociosAnaliseIdentificacao((atual) => ({
        ...atual,
        [indice]: { analisando: false, analise: null },
      }));
    }
  }

  async function consultarQsaSeCompleto(cnpjMascarado: string) {
    const cnpjLimpo = agenciaAdapter.toQsaConsultaInput(cnpjMascarado);

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
    } catch {
      // Consulta é best-effort (rate limit ou instabilidade da Receita não
      // devem travar o preenchimento) — o usuário completa os campos manualmente.
      setQsaResult(null);
    } finally {
      setQsaChecking(false);
    }
  }

  // Valida antes de aceitar o arquivo (mesma regra que o backend reaplica
  // na rota) — a View só recebe o resultado já decidido, nunca a regra em si.
  function setContratoSocial(file: File | null) {
    if (!file) {
      setContratoSocialErro(null);
      setContratoSocialRaw(null);
      setContratoSocialAnalise(null);
      return;
    }

    const erro = validarArquivoUpload(file, "Contrato Social");
    setContratoSocialErro(erro);
    setContratoSocialRaw(erro ? null : file);
    if (!erro) {
      void analisarContratoSocialSeCompleto(cnpj, file);
    }
  }

  function setCnpj(valorDigitado: string) {
    const mascarado = maskCnpj(valorDigitado);
    setCnpjRaw(mascarado);
    setCnpjStatus(validarCnpjComMensagem(mascarado));
    void consultarQsaSeCompleto(mascarado);
    void analisarContratoSocialSeCompleto(mascarado, contratoSocial);
    socios.forEach((socio, index) => {
      if (socio.rgArquivo) {
        void analisarDocumentoIdentificacaoSeCompleto(mascarado, index, socio.rgArquivo);
      }
    });
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
    // Índices deslocam depois da remoção — mais simples limpar os erros de
    // arquivo e o estado de análise do que tentar realinhar os mapas
    // (reaparecem se o usuário reanexar um arquivo).
    setSociosArquivoErros({});
    setSociosAnaliseIdentificacao({});
    setSociosValoresExtraidosIa({});
  }

  function updateSocio(index: number, patch: Partial<SocioWizardFormValues>) {
    const patchValidado = { ...patch };

    const SEM_ERRO_ARQUIVO = { rg: null, procuracao: null };

    if ("rgArquivo" in patch) {
      const arquivo = patch.rgArquivo ?? null;
      const erro = arquivo ? validarArquivoUpload(arquivo, "RG ou CNH") : null;
      setSociosArquivoErros((atual) => ({
        ...atual,
        [index]: { ...(atual[index] ?? SEM_ERRO_ARQUIVO), rg: erro },
      }));
      patchValidado.rgArquivo = erro ? null : arquivo;

      if (patchValidado.rgArquivo) {
        void analisarDocumentoIdentificacaoSeCompleto(cnpj, index, patchValidado.rgArquivo);
      } else {
        setSociosAnaliseIdentificacao((atual) => {
          const proximo = { ...atual };
          delete proximo[index];
          return proximo;
        });
        // Só limpa o que vinha do RG/CNH — nome/endereço extraídos do
        // contrato social não dependem desse arquivo e continuam válidos.
        setSociosValoresExtraidosIa((atual) => {
          if (!atual[index]) return atual;
          return {
            ...atual,
            [index]: {
              ...atual[index],
              cpf: null,
              dataNascimento: null,
              rg: null,
              rgOrgaoEmissor: null,
              rgUf: null,
            },
          };
        });
      }
    }

    if ("procuracaoArquivo" in patch) {
      const arquivo = patch.procuracaoArquivo ?? null;
      const erro = arquivo ? validarArquivoUpload(arquivo, "Procuração") : null;
      setSociosArquivoErros((atual) => ({
        ...atual,
        [index]: { ...(atual[index] ?? SEM_ERRO_ARQUIVO), procuracao: erro },
      }));
      patchValidado.procuracaoArquivo = erro ? null : arquivo;
    }

    let cepParaBuscarAutomaticamente: string | null = null;

    setSocios((current) =>
      current.map((socio, i) => {
        if (i !== index) return socio;
        const atualizado = { ...socio, ...patchValidado };

        if ("cpf" in patchValidado && patchValidado.cpf !== undefined) {
          atualizado.cpf = maskCpf(patchValidado.cpf);
        }
        if ("telefone" in patchValidado && patchValidado.telefone !== undefined) {
          atualizado.telefone = maskTelefone(patchValidado.telefone, atualizado.telefonePais);
        }
        if ("telefonePais" in patchValidado && patchValidado.telefonePais !== undefined) {
          atualizado.telefone = maskTelefone(atualizado.telefone, patchValidado.telefonePais);
        }
        if ("cep" in patchValidado && patchValidado.cep !== undefined) {
          const cepAnteriorLimpo = cepAdapter.toBuscaCepInput(socio.cep);
          atualizado.cep = maskCep(patchValidado.cep);
          const cepNovoLimpo = cepAdapter.toBuscaCepInput(atualizado.cep);
          if (cepAnteriorLimpo.length < 8 && cepNovoLimpo.length === 8) {
            cepParaBuscarAutomaticamente = cepNovoLimpo;
          }
        }

        return atualizado;
      }),
    );

    if (cepParaBuscarAutomaticamente) {
      void executarBuscaCepSocio(index, cepParaBuscarAutomaticamente);
    }
  }

  function toggleRepresentante(index: number) {
    setSocios(
      socios.map((socio, i) => ({
        ...socio,
        isRepresentante: i === index ? !socio.isRepresentante : false,
      })),
    );
  }

  async function executarBuscaCepSocio(index: number, cepLimpo: string) {
    setSocioCepBuscando(index);

    try {
      const raw = await cepService.buscar(cepLimpo);
      const endereco = cepAdapter.toEnderecoView(raw);

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

  async function buscarCepSocio(index: number) {
    const socio = socios[index];
    if (!socio) return;

    const cepLimpo = cepAdapter.toBuscaCepInput(socio.cep);
    if (cepLimpo.length !== 8) return;

    await executarBuscaCepSocio(index, cepLimpo);
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
    let cepParaBuscarAutomaticamente: string | null = null;

    setEnderecoBanco((current) => {
      const atualizado = { ...current, ...patch };

      if ("cep" in patch && patch.cep !== undefined) {
        const cepAnteriorLimpo = cepAdapter.toBuscaCepInput(current.cep);
        atualizado.cep = maskCep(patch.cep);
        const cepNovoLimpo = cepAdapter.toBuscaCepInput(atualizado.cep);
        if (cepAnteriorLimpo.length < 8 && cepNovoLimpo.length === 8) {
          cepParaBuscarAutomaticamente = cepNovoLimpo;
        }
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

      return atualizado;
    });

    if (cepParaBuscarAutomaticamente) {
      void executarBuscaCepEnderecoBanco(cepParaBuscarAutomaticamente);
    }
  }

  async function executarBuscaCepEnderecoBanco(cepLimpo: string) {
    setEnderecoBancoCepBuscando(true);

    try {
      const raw = await cepService.buscar(cepLimpo);
      const endereco = cepAdapter.toEnderecoView(raw);

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

  async function buscarCepEnderecoBanco() {
    const cepLimpo = cepAdapter.toBuscaCepInput(enderecoBanco.cep);
    if (cepLimpo.length !== 8) return;

    await executarBuscaCepEnderecoBanco(cepLimpo);
  }

  // Validação de campo é decidida aqui (única fonte de verdade), nunca
  // pelos componentes de apresentação — eles só recebem o resultado.
  const telefoneComercialInvalido =
    telefoneComercial.length > 0 && !validarTelefone(telefoneComercial, telefoneComercialPais);
  const emailOperacionalInvalido = emailOperacional.length > 0 && !validarEmail(emailOperacional);
  const emailComercialInvalido = emailComercial.length > 0 && !validarEmail(emailComercial);
  const emailFinanceiroInvalido = emailFinanceiro.length > 0 && !validarEmail(emailFinanceiro);

  const sociosValidacao = socios.map((socio, index) => ({
    cpfStatus: validarCpfComMensagem(socio.cpf),
    dataNascimentoStatus: validarDataNascimentoComMensagem(socio.dataNascimento),
    emailInvalido: socio.email.length > 0 && !validarEmail(socio.email),
    telefoneInvalido:
      socio.telefone.length > 0 && !validarTelefone(socio.telefone, socio.telefonePais),
    rgErro: sociosArquivoErros[index]?.rg ?? null,
    procuracaoErro: sociosArquivoErros[index]?.procuracao ?? null,
  }));

  // Gating: contrato social só libera upload depois do CNPJ completo (14
  // dígitos); telefone/e-mails da empresa só liberam depois da análise do
  // contrato social resolver (com ou sem sucesso — best-effort, não trava
  // o usuário se a IA falhar). Cada sócio só libera o resto do form depois
  // do upload do RG/CNH — ver socio-wizard-card.tsx.
  const cnpjCompleto = agenciaAdapter.toQsaConsultaInput(cnpj).length >= 14;
  const empresaCamposDesbloqueados = Boolean(contratoSocial) && !analisandoContratoSocial;
  const sociosGating = socios.map((socio) => ({ rgUploadPendente: !socio.rgArquivo }));

  const documentosPendentes: string[] = [];
  if (!contratoSocial) documentosPendentes.push("Contrato Social da empresa");
  socios.forEach((socio, index) => {
    const rotulo = socio.nome || `Sócio ${index + 1}`;
    if (!socio.rgArquivo) documentosPendentes.push(`RG ou CNH — ${rotulo}`);
    if (socio.isRepresentante && !socio.procuracaoArquivo) {
      documentosPendentes.push(`Procuração — ${rotulo} (representante)`);
    }
  });

  async function submit() {
    if (!contratoSocial || documentosPendentes.length > 0) {
      setSubmitError("Anexe todos os documentos pendentes antes de enviar.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setFaseSubmit("analisando");
    inicioAnaliseRef.current = Date.now();

    const formData = agenciaAdapter.toFinalizarCadastroFormData({
      cnpjMascarado: cnpj,
      contratoSocial,
      origem,
      telefoneComercial,
      telefoneComercialPais,
      semTelefoneComercial,
      emailOperacional,
      emailComercial,
      emailFinanceiro,
      socios,
      enderecoBanco,
    });

    try {
      const raw = await agenciaService.criarAgencia(formData);
      const resultado = agenciaAdapter.toSubmitResultView(raw);

      // Espera o mínimo ANTES de decidir qualquer desfecho — mesmo um erro
      // de validação que volta em milissegundos precisa manter a tela de
      // análise no ar pelo tempo mínimo configurado.
      await aguardarDuracaoMinimaAnalise();

      if (resultado.success) {
        setSubmitPrecisaRevisaoManual(Boolean(resultado.precisaRevisaoManual));
        setSubmitSuccess(true);
        // Cadastro já persistido de verdade no banco — o rascunho salvo
        // localmente (autosave) não tem mais função, limpa.
        void useCadastroWizardStore.persist.clearStorage();
        setFaseSubmit(resultado.precisaRevisaoManual ? "revisao" : "aprovado");
        return;
      }

      if (resultado.duplicado) {
        setFaseSubmit("idle");
        setSubmitDuplicado(true);
        return;
      }

      setFaseSubmit("idle");
      setSubmitError(resultado.error ?? "Não foi possível enviar o cadastro.");
    } catch {
      await aguardarDuracaoMinimaAnalise();
      setFaseSubmit("idle");
      setSubmitError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
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
    contratoSocialErro,
    analisandoContratoSocial,
    contratoSocialAnalise,
    setCnpj,
    setContratoSocial,
    cnpjCompleto,
    empresaCamposDesbloqueados,

    telefoneComercial,
    telefoneComercialPais,
    semTelefoneComercial,
    telefoneComercialInvalido,
    emailOperacional,
    emailComercial,
    emailFinanceiro,
    emailOperacionalInvalido,
    emailComercialInvalido,
    emailFinanceiroInvalido,
    setTelefoneComercial,
    setTelefoneComercialPais,
    setSemTelefoneComercial,
    setEmailOperacional,
    setEmailComercial,
    setEmailFinanceiro,
    usarEmailOperacionalParaTodos,

    socios,
    sociosValidacao,
    sociosAnaliseIdentificacao,
    sociosValoresExtraidosIa,
    sociosGating,
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

    documentosPendentes,
    isSubmitting,
    submitError,
    submitSuccess,
    submitPrecisaRevisaoManual,
    submitDuplicado,
    submit,
    faseSubmit,
  };
}
