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
import {
  maskTelefone,
  maskTelefoneComercial,
  paisTelefonePorCodigo,
  unmaskTelefone,
  validarTelefone,
  validarTelefoneComercial,
} from "@/modules/shared/utils/telefone.util";
import { validarEmail } from "@/modules/shared/utils/email.util";
import { maskCpf, unmaskCpf, validarCpfComMensagem } from "@/modules/cadastro/utils/cpf.util";
import { validarDataNascimentoComMensagem } from "@/modules/cadastro/utils/data-nascimento.util";
import { maskCep } from "@/modules/cadastro/utils/cep.util";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";
import { cepService } from "@/modules/cadastro/services/cep.service";
import { criarSocioWizardVazio } from "@/modules/cadastro/types/socio-wizard.types";
import type { SocioWizardFormValues } from "@/modules/cadastro/types/socio-wizard.types";
import type { Banco, EnderecoBancoFormValues } from "@/modules/cadastro/types/endereco-banco.types";
import type { DocumentoIdentificacaoAnaliseView } from "@/modules/cadastro/types/agencia.types";

interface SocioAnaliseIdentificacaoState {
  analisando: boolean;
  analise: DocumentoIdentificacaoAnaliseView | null;
}

// Campo obrigatório vazio/inválido de uma seção — `campo` é a mesma
// chave usada pelo setter/updater daquele valor (ex.: "emailOperacional",
// "cep"), reaproveitada como identificador em vez de inventar um
// dicionário novo (ver data-campo nos componentes de passo).
export interface CampoFaltante {
  campo: string;
  label: string;
}

// Documentos + Empresa (antigos Passo 1 e 2) viraram uma seção só. A
// seção Comercial foi removida e Representação virou uma flag dentro do
// form de Sócios (o procurador é tratado como um sócio, com slot extra
// de procuração) — não é mais uma seção separada. "Executivo e Associação"
// saiu de dentro de Banco e virou etapa própria (2026-07-26), sempre por
// último antes da Revisão — nenhum dos dois campos é obrigatório.
export const ETAPA_LABELS = [
  "Empresa",
  "Sócios",
  "Endereço",
  "Banco",
  "Executivo e Associação",
  "Revisão",
];

export interface ExecutivoOption {
  id: string;
  nome: string;
}

export interface AssociacaoOption {
  id: string;
  nome: string;
}

interface UseCadastroWizardOptions {
  origem: string | null;
  // Já resolvidos/validados no server component (page.tsx) — presentes
  // aqui só quando o acesso veio por um link personalizado (pessoal de
  // promotor ou de Evento); nesse caso o campo correspondente nasce
  // travado no formulário (ver Passo2Empresa).
  executivoId: string | null;
  associacaoId: string | null;
  eventoId: string | null;
  // Listas reais pro combobox de busca (Promotor/Associacao) — vêm do
  // server component, a página pública não conhece esses domínios além
  // de precisar exibi-los.
  executivos: ExecutivoOption[];
  associacoes: AssociacaoOption[];
}

// Orquestra a revelação progressiva das seções (página única, sem
// bloqueio de validação — só no envio final) e a lógica de campos da
// seção Empresa (CNPJ + contrato social + consulta QSA + dados da
// empresa).
export function useCadastroWizardViewModel({
  origem,
  executivoId,
  associacaoId,
  eventoId,
  executivos,
  associacoes,
}: UseCadastroWizardOptions) {
  const secoesReveladas = useCadastroWizardStore((state) => state.secoesReveladas);
  const avancarSecao = useCadastroWizardStore((state) => state.avancarSecao);
  const setOrigem = useCadastroWizardStore((state) => state.setOrigem);
  const executivoIdSalvo = useCadastroWizardStore((state) => state.executivoId);
  const setExecutivoId = useCadastroWizardStore((state) => state.setExecutivoId);
  const associacaoIdSalvo = useCadastroWizardStore((state) => state.associacaoId);
  const setAssociacaoId = useCadastroWizardStore((state) => state.setAssociacaoId);
  const eventoIdSalvo = useCadastroWizardStore((state) => state.eventoId);
  const setEventoId = useCadastroWizardStore((state) => state.setEventoId);
  // Travado (não editável) só quando a própria prop da URL trouxe um
  // valor — uma seleção manual anterior (sem link) nunca trava o campo.
  const executivoTravado = Boolean(executivoId);
  const associacaoTravado = Boolean(associacaoId);

  const cnpj = useCadastroWizardStore((state) => state.cnpj);
  const cnpjStatus = useCadastroWizardStore((state) => state.cnpjStatus);
  const avisoAlfanumerico = useCadastroWizardStore((state) => state.avisoAlfanumerico);
  const verificandoCnpjCadastrado = useCadastroWizardStore(
    (state) => state.verificandoCnpjCadastrado,
  );
  const cnpjJaCadastrado = useCadastroWizardStore((state) => state.cnpjJaCadastrado);
  const contratoSocial = useCadastroWizardStore((state) => state.contratoSocial);
  const analisandoContratoSocial = useCadastroWizardStore(
    (state) => state.analisandoContratoSocial,
  );
  const contratoSocialAnalise = useCadastroWizardStore((state) => state.contratoSocialAnalise);
  const razaoSocial = useCadastroWizardStore((state) => state.razaoSocial);
  const nomeFantasia = useCadastroWizardStore((state) => state.nomeFantasia);

  const setCnpjRaw = useCadastroWizardStore((state) => state.setCnpj);
  const setCnpjStatus = useCadastroWizardStore((state) => state.setCnpjStatus);
  const setVerificandoCnpjCadastrado = useCadastroWizardStore(
    (state) => state.setVerificandoCnpjCadastrado,
  );
  const setCnpjJaCadastrado = useCadastroWizardStore((state) => state.setCnpjJaCadastrado);
  const setContratoSocialRaw = useCadastroWizardStore((state) => state.setContratoSocial);
  const setAnalisandoContratoSocial = useCadastroWizardStore(
    (state) => state.setAnalisandoContratoSocial,
  );
  const setContratoSocialAnalise = useCadastroWizardStore(
    (state) => state.setContratoSocialAnalise,
  );
  const setRazaoSocial = useCadastroWizardStore((state) => state.setRazaoSocial);
  const setNomeFantasia = useCadastroWizardStore((state) => state.setNomeFantasia);

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
  const submitDuplicado = useCadastroWizardStore((state) => state.duplicado);
  const setSubmitting = useCadastroWizardStore((state) => state.setSubmitting);
  const setSubmitError = useCadastroWizardStore((state) => state.setError);
  const setSubmitDuplicado = useCadastroWizardStore((state) => state.setDuplicado);
  const resetWizardStore = useCadastroWizardStore((state) => state.reset);

  // "analisando" cobre a espera pós-clique em Enviar até o cadastro ser
  // persistido no servidor; "recebido" é o desfecho final — a IA (análise
  // de documentos, avaliação final, geração do contrato) roda depois, de
  // forma assíncrona, então o resultado (aprovado ou revisão manual) não
  // é mais conhecido nesta resposta — ver AnalisarCadastroUseCase. A
  // duração mínima de "analisando" vale pra QUALQUER desfecho (sucesso,
  // duplicado ou erro) — sem isso, uma resposta rápida do servidor (ex:
  // erro de validação em <1s) fazia a animação sumir quase instantaneamente.
  const [faseSubmit, setFaseSubmit] = useState<"idle" | "analisando" | "recebido">("idle");
  const inicioAnaliseRef = useRef<number | null>(null);

  const DURACAO_MINIMA_ANALISE_MS = 10000;

  // Lista de bancos (BrasilAPI, via proxy do backend) pro combobox buscável
  // do Passo 6 — carregada uma vez só, no mount, independente da seção
  // estar visível ainda (evita esperar o usuário chegar no Passo 6 pra só
  // então disparar a busca).
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [bancosCarregando, setBancosCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function carregarBancos() {
      try {
        const raw = await agenciaService.listarBancos();
        if (!cancelado) setBancos(raw);
      } catch {
        // Best-effort — sem lista, o campo de banco cai pro estado vazio
        // (usuário não fica travado, só perde a busca).
        if (!cancelado) setBancos([]);
      } finally {
        if (!cancelado) setBancosCarregando(false);
      }
    }

    void carregarBancos();
    return () => {
      cancelado = true;
    };
  }, []);

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

  // Só grava quando vier preenchido (diferente do setOrigem acima) — uma
  // vez capturada a atribuição via link, uma revisita sem o parâmetro
  // (ex.: continuando o rascunho salvo) não pode apagar o que já foi
  // guardado.
  useEffect(() => {
    if (executivoId) setExecutivoId(executivoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executivoId]);

  useEffect(() => {
    if (associacaoId) setAssociacaoId(associacaoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associacaoId]);

  useEffect(() => {
    if (eventoId) setEventoId(eventoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  // Quando a análise do contrato social resolve, tenta preencher um card de
  // sócio pra cada item de `qsa` — nome, cpf, data de nascimento, RG e
  // endereço já vêm do próprio contrato social agora (antes só o nome).
  // doc_identificacao continua completando o que faltar (mesma regra
  // fill-if-empty de sempre, já que o merge daqui roda primeiro — contrato
  // social é anexado no Passo 1, antes do RG no Passo 5).
  useEffect(() => {
    if (!contratoSocialAnalise) return;

    const atualizados = [...socios];
    contratoSocialAnalise.socios.forEach((socioExtraido, index) => {
      if (!atualizados[index]) {
        atualizados[index] = criarSocioWizardVazio();
      }
      if (socioExtraido.nome) {
        atualizados[index] = { ...atualizados[index], nome: socioExtraido.nome };
      }
      if (socioExtraido.cpf) {
        atualizados[index] = { ...atualizados[index], cpf: maskCpf(socioExtraido.cpf) };
      }
      if (socioExtraido.dataNascimento) {
        atualizados[index] = {
          ...atualizados[index],
          dataNascimento: socioExtraido.dataNascimento,
        };
      }
      if (socioExtraido.estadoCivil) {
        atualizados[index] = { ...atualizados[index], estadoCivil: socioExtraido.estadoCivil };
      }
      if (socioExtraido.nacionalidade) {
        atualizados[index] = { ...atualizados[index], nacionalidade: socioExtraido.nacionalidade };
      }
      if (socioExtraido.administrativo !== null) {
        atualizados[index] = {
          ...atualizados[index],
          administrativo: socioExtraido.administrativo,
        };
      }
      if (socioExtraido.rg) {
        atualizados[index] = { ...atualizados[index], rg: socioExtraido.rg };
      }
      if (socioExtraido.rgExpedidor) {
        atualizados[index] = {
          ...atualizados[index],
          rgOrgaoEmissor: socioExtraido.rgExpedidor,
        };
      }
      if (socioExtraido.rgExpedidoUf) {
        atualizados[index] = { ...atualizados[index], rgUf: socioExtraido.rgExpedidoUf };
      }
      const endereco = socioExtraido.endereco;
      if (endereco) {
        atualizados[index] = {
          ...atualizados[index],
          cep: endereco.cep ? maskCep(endereco.cep) : atualizados[index].cep,
          logradouro: endereco.logradouro || atualizados[index].logradouro,
          numero: endereco.numero || atualizados[index].numero,
          complemento: endereco.complemento || atualizados[index].complemento,
          bairro: endereco.bairro || atualizados[index].bairro,
          cidade: endereco.cidade || atualizados[index].cidade,
          uf: endereco.uf || atualizados[index].uf,
        };
      }
    });
    setSocios(atualizados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoSocialAnalise]);

  // Dados da empresa extraídos do contrato social — substituem o que antes
  // vinha do QSA/ReceitaWS (razão social) e nunca tinha um lugar pra ir
  // (endereço da empresa). Preenchimento campo a campo, nunca sobrescreve o
  // que já está preenchido — mesma regra do resto do wizard.
  useEffect(() => {
    if (!contratoSocialAnalise) return;

    if (!razaoSocial && contratoSocialAnalise.razaoSocial) {
      setRazaoSocial(contratoSocialAnalise.razaoSocial);
    }

    if (!nomeFantasia && contratoSocialAnalise.nomeFantasia) {
      setNomeFantasia(contratoSocialAnalise.nomeFantasia);
    }

    const endereco = contratoSocialAnalise.endereco;
    if (endereco) {
      setEnderecoBanco((atual) => ({
        ...atual,
        cep: atual.cep || (endereco.cep ? maskCep(endereco.cep) : atual.cep),
        logradouro: atual.logradouro || endereco.logradouro || atual.logradouro,
        numero: atual.numero || endereco.numero || atual.numero,
        complemento: atual.complemento || endereco.complemento || atual.complemento,
        bairro: atual.bairro || endereco.bairro || atual.bairro,
        cidade: atual.cidade || endereco.cidade || atual.cidade,
        uf: atual.uf || endereco.uf || atual.uf,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoSocialAnalise]);

  async function analisarContratoSocialSeCompleto(cnpjMascarado: string, arquivo: File | null) {
    if (!arquivo) return;

    const cnpjLimpo = agenciaAdapter.toCnpjLimpo(cnpjMascarado);
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

    const cnpjLimpo = agenciaAdapter.toCnpjLimpo(cnpjMascarado);
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

      // Sempre aplica o valor mais recente extraído do RG/CNH anexado —
      // decisão do usuário: trocar o documento (ex.: subiu o errado, corrige
      // depois) precisa refletir nos campos sozinho, sem exigir que o
      // usuário apague manualmente o que a análise anterior preencheu. Só
      // não mexe em campo que a IA não retornou dessa vez (undefined/null
      // mantém o valor atual).
      setSocios((current) =>
        current.map((socio, i) => {
          if (i !== indice) return socio;
          const atualizado = { ...socio };
          if (analise.nome) atualizado.nome = analise.nome;
          if (analise.cpf) atualizado.cpf = maskCpf(analise.cpf);
          if (analise.dataNascimento) atualizado.dataNascimento = analise.dataNascimento;
          if (analise.rg) atualizado.rg = analise.rg;
          if (analise.rgOrgaoEmissor) atualizado.rgOrgaoEmissor = analise.rgOrgaoEmissor;
          if (analise.rgUf) atualizado.rgUf = analise.rgUf;
          return atualizado;
        }),
      );
    } catch {
      // Best-effort — falha na análise não deve travar o preenchimento manual.
      setSociosAnaliseIdentificacao((atual) => ({
        ...atual,
        [indice]: { analisando: false, analise: null },
      }));
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

  // Aviso antecipado — não bloqueia o preenchimento nem substitui a
  // checagem real do submit final (FinalizarCadastroUseCase): é só um
  // "ei, esse CNPJ já tem cadastro" o mais cedo possível. Best-effort:
  // falha (rate limit, instabilidade) não trava o usuário, só deixa de
  // mostrar o aviso.
  async function verificarCnpjCadastradoSeCompleto(cnpjMascarado: string) {
    const cnpjLimpo = agenciaAdapter.toCnpjLimpo(cnpjMascarado);

    if (cnpjLimpo.length < 14) {
      setCnpjJaCadastrado(false);
      return;
    }

    setVerificandoCnpjCadastrado(true);

    try {
      const existe = await agenciaService.verificarCnpjCadastrado(cnpjLimpo);
      setCnpjJaCadastrado(existe);
    } catch {
      setCnpjJaCadastrado(false);
    } finally {
      setVerificandoCnpjCadastrado(false);
    }
  }

  function setCnpj(valorDigitado: string) {
    const mascarado = maskCnpj(valorDigitado);
    setCnpjRaw(mascarado);
    setCnpjStatus(validarCnpjComMensagem(mascarado));
    // ReceitaWS/QSA não é mais consultada aqui — razão social e sócios vêm
    // do contrato social (ver analisarContratoSocialSeCompleto abaixo e o
    // useEffect de dados da empresa).
    void analisarContratoSocialSeCompleto(mascarado, contratoSocial);
    void verificarCnpjCadastradoSeCompleto(mascarado);
    socios.forEach((socio, index) => {
      if (socio.rgArquivo) {
        void analisarDocumentoIdentificacaoSeCompleto(mascarado, index, socio.rgArquivo);
      }
    });
  }

  function setTelefoneComercial(valorDigitado: string) {
    setTelefoneComercialRaw(maskTelefoneComercial(valorDigitado, telefoneComercialPais));
  }

  function setTelefoneComercialPais(pais: string) {
    setTelefoneComercialPaisRaw(pais);
    setTelefoneComercialRaw(maskTelefoneComercial(telefoneComercial, pais));
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
        atualizado.bancoCodigo = "";
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
        atualizado.favorecidoNome = razaoSocial || "";
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
    telefoneComercial.length > 0 &&
    !validarTelefoneComercial(telefoneComercial, telefoneComercialPais);
  const emailOperacionalInvalido = emailOperacional.length > 0 && !validarEmail(emailOperacional);
  const emailComercialInvalido = emailComercial.length > 0 && !validarEmail(emailComercial);
  const emailFinanceiroInvalido = emailFinanceiro.length > 0 && !validarEmail(emailFinanceiro);

  // CPF/e-mail duplicados entre sócios: mesma regra do backend
  // (finalizarCadastroMetaSchema), replicada aqui só pra bloquear o
  // "Continuar" do passo de sócios antes do submit — o banco não garante
  // mais isso (RepresentanteLegal não tem @@unique de cpf: a mesma
  // pessoa pode ser sócia em agências diferentes).
  function contarOcorrencias(valores: string[]): Map<string, number> {
    const contagem = new Map<string, number>();
    valores.forEach((valor) => {
      if (!valor) return;
      contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
    });
    return contagem;
  }

  const cpfsNormalizados = socios.map((socio) => unmaskCpf(socio.cpf));
  const emailsNormalizados = socios.map((socio) => socio.email.trim().toLowerCase());
  const telefonesNormalizados = socios.map((socio) => unmaskTelefone(socio.telefone));
  const contagemCpf = contarOcorrencias(cpfsNormalizados);
  const contagemEmail = contarOcorrencias(emailsNormalizados);
  const contagemTelefone = contarOcorrencias(
    telefonesNormalizados.filter((telefone) => telefone.length > 0),
  );

  const sociosValidacao = socios.map((socio, index) => {
    const cpfDuplicado = (contagemCpf.get(cpfsNormalizados[index]!) ?? 0) > 1;
    const emailDuplicado = (contagemEmail.get(emailsNormalizados[index]!) ?? 0) > 1;
    const emailFormatoInvalido = socio.email.length > 0 && !validarEmail(socio.email);
    const telefoneFormatoInvalido =
      socio.telefone.length > 0 && !validarTelefone(socio.telefone, socio.telefonePais);
    const telefoneDuplicado =
      telefonesNormalizados[index]!.length > 0 &&
      (contagemTelefone.get(telefonesNormalizados[index]!) ?? 0) > 1;

    return {
      cpfStatus: cpfDuplicado
        ? { valido: false, mensagem: "CPF já usado por outro sócio nesta lista." }
        : validarCpfComMensagem(socio.cpf),
      dataNascimentoStatus: validarDataNascimentoComMensagem(socio.dataNascimento),
      emailInvalido: emailFormatoInvalido || emailDuplicado,
      emailErro: emailDuplicado
        ? "E-mail já usado por outro sócio nesta lista."
        : emailFormatoInvalido
          ? "E-mail inválido."
          : null,
      telefoneInvalido: telefoneFormatoInvalido || telefoneDuplicado,
      telefoneErro: telefoneDuplicado
        ? "Telefone já usado por outro sócio nesta lista."
        : telefoneFormatoInvalido
          ? `Telefone incompleto para ${paisTelefonePorCodigo(socio.telefonePais).nome}.`
          : null,
      rgErro: sociosArquivoErros[index]?.rg ?? null,
      procuracaoErro: sociosArquivoErros[index]?.procuracao ?? null,
    };
  });

  // Gating: contrato social só libera upload depois do CNPJ completo (14
  // dígitos); telefone/e-mails da empresa só liberam depois da análise do
  // contrato social resolver (com ou sem sucesso — best-effort, não trava
  // o usuário se a IA falhar). Cada sócio só libera o resto do form depois
  // do upload do RG/CNH — ver socio-wizard-card.tsx.
  const cnpjCompleto = agenciaAdapter.toCnpjLimpo(cnpj).length >= 14;
  const empresaCamposDesbloqueados = Boolean(contratoSocial) && !analisandoContratoSocial;

  // "Completo" = já dá pra avançar pra próxima etapa sem estourar erro no
  // envio final (mesmas regras obrigatórias de finalizarCadastroMetaSchema/
  // socioMetaSchema/enderecoBancoMetaSchema). Fonte única: cada seção
  // deriva sua lista de "campos faltantes" primeiro (usada pra mostrar
  // qual campo falta + destacar ele, ver tentarAvancarSecao), e o
  // booleano "completo" é só `lista.length === 0` — evita duas
  // implementações da mesma regra podendo divergir. Nenhum destes
  // bloqueia edição, só o botão "Continuar".
  const camposFaltantesEmpresa: CampoFaltante[] = [];
  if (!contratoSocial) {
    camposFaltantesEmpresa.push({ campo: "contratoSocial", label: "Contrato Social" });
  }
  if (!cnpjStatus.valido) {
    camposFaltantesEmpresa.push({ campo: "cnpj", label: "CNPJ" });
  } else if (cnpjJaCadastrado) {
    camposFaltantesEmpresa.push({ campo: "cnpj", label: "CNPJ (já cadastrado)" });
  }
  if (!semTelefoneComercial && (telefoneComercial.length === 0 || telefoneComercialInvalido)) {
    camposFaltantesEmpresa.push({ campo: "telefoneComercial", label: "Telefone Comercial" });
  }
  if (emailOperacional.length === 0 || emailOperacionalInvalido) {
    camposFaltantesEmpresa.push({
      campo: "emailOperacional",
      label: "E-mail responsável operacional",
    });
  }
  if (emailComercialInvalido) {
    camposFaltantesEmpresa.push({
      campo: "emailComercial",
      label: "E-mail setor comercial (inválido)",
    });
  }
  if (emailFinanceiroInvalido) {
    camposFaltantesEmpresa.push({
      campo: "emailFinanceiro",
      label: "E-mail setor financeiro (inválido)",
    });
  }
  const empresaCompleta = camposFaltantesEmpresa.length === 0;

  function camposFaltantesSocio(
    socio: SocioWizardFormValues,
    validacao: (typeof sociosValidacao)[number],
  ): CampoFaltante[] {
    const faltantes: CampoFaltante[] = [];
    if (socio.nome.trim().length === 0) faltantes.push({ campo: "nome", label: "Nome completo" });
    if (!validacao.cpfStatus.valido) faltantes.push({ campo: "cpf", label: "CPF" });
    if (socio.email.length === 0 || validacao.emailInvalido) {
      faltantes.push({ campo: "email", label: "E-mail" });
    }
    if (socio.telefone.length === 0 || validacao.telefoneInvalido) {
      faltantes.push({ campo: "telefone", label: "Telefone" });
    }
    if (!validacao.dataNascimentoStatus.valido) {
      faltantes.push({ campo: "dataNascimento", label: "Data de Nascimento" });
    }
    if (socio.estadoCivil.length === 0) {
      faltantes.push({ campo: "estadoCivil", label: "Estado Civil" });
    }
    if (socio.nacionalidade.trim().length === 0) {
      faltantes.push({ campo: "nacionalidade", label: "Nacionalidade" });
    }
    if (socio.cep.length === 0) faltantes.push({ campo: "socioCep", label: "CEP" });
    if (socio.logradouro.length === 0) {
      faltantes.push({ campo: "socioLogradouro", label: "Logradouro" });
    }
    if (socio.numero.length === 0) faltantes.push({ campo: "socioNumero", label: "Número" });
    if (socio.bairro.length === 0) faltantes.push({ campo: "socioBairro", label: "Bairro" });
    if (socio.cidade.length === 0) faltantes.push({ campo: "socioCidade", label: "Cidade" });
    if (socio.uf.length === 0) faltantes.push({ campo: "socioUf", label: "UF" });
    if (!socio.rgArquivo) faltantes.push({ campo: "rgArquivo", label: "RG ou CNH" });
    if (socio.isRepresentante && !socio.procuracaoArquivo) {
      faltantes.push({ campo: "procuracaoArquivo", label: "Procuração" });
    }
    return faltantes;
  }
  const sociosCamposFaltantes = socios.map((socio, index) =>
    camposFaltantesSocio(socio, sociosValidacao[index]!),
  );
  const sociosCompletos = sociosCamposFaltantes.map((faltantes) => faltantes.length === 0);

  const camposFaltantesEndereco: CampoFaltante[] = [];
  if (enderecoBanco.enderecoMesmoSocio) {
    if (
      enderecoBanco.socioEnderecoVinculado === null ||
      !socios[enderecoBanco.socioEnderecoVinculado]?.logradouro
    ) {
      camposFaltantesEndereco.push({
        campo: "socioEnderecoVinculado",
        label: "Sócio vinculado ao endereço",
      });
    }
  } else {
    if (enderecoBanco.cep.length === 0)
      camposFaltantesEndereco.push({ campo: "cep", label: "CEP" });
    if (enderecoBanco.logradouro.length === 0) {
      camposFaltantesEndereco.push({ campo: "logradouro", label: "Logradouro" });
    }
    if (enderecoBanco.numero.length === 0) {
      camposFaltantesEndereco.push({ campo: "numero", label: "Número" });
    }
    if (enderecoBanco.bairro.length === 0) {
      camposFaltantesEndereco.push({ campo: "bairro", label: "Bairro" });
    }
    if (enderecoBanco.cidade.length === 0) {
      camposFaltantesEndereco.push({ campo: "cidade", label: "Cidade" });
    }
    if (enderecoBanco.uf.length === 0) camposFaltantesEndereco.push({ campo: "uf", label: "UF" });
  }
  const enderecoCompleto = camposFaltantesEndereco.length === 0;

  const camposFaltantesBanco: CampoFaltante[] = [];
  if (enderecoBanco.bancoNome.length === 0) {
    camposFaltantesBanco.push({ campo: "bancoNome", label: "Banco" });
  }
  if (enderecoBanco.bancoAgencia.length === 0) {
    camposFaltantesBanco.push({ campo: "bancoAgencia", label: "Agência" });
  }
  if (enderecoBanco.bancoConta.length === 0) {
    camposFaltantesBanco.push({ campo: "bancoConta", label: "Conta" });
  }
  if (enderecoBanco.tipoConta.length === 0) {
    camposFaltantesBanco.push({ campo: "tipoConta", label: "Tipo de Conta" });
  }
  if (enderecoBanco.favorecidoNome.length === 0) {
    camposFaltantesBanco.push({ campo: "favorecidoNome", label: "Nome do Favorecido" });
  }
  if (enderecoBanco.favorecidoDoc.length === 0) {
    camposFaltantesBanco.push({ campo: "favorecidoDoc", label: "CPF/CNPJ do Favorecido" });
  }
  if (enderecoBanco.bancoPais === "internacional" && enderecoBanco.bancoSwift.length === 0) {
    camposFaltantesBanco.push({ campo: "bancoSwift", label: "SWIFT" });
  }
  const bancoCompleto = camposFaltantesBanco.length === 0;

  // Feedback de UI (não é dado de formulário, não persiste): que seções
  // já tiveram uma tentativa de avançar sem estar completas — controla
  // se a mensagem de "campo faltante" e a borda pulsante aparecem. Some
  // sozinho quando o campo é corrigido (a lista de faltantes recalcula a
  // cada render), sem precisar limpar manualmente.
  const [secoesTentativaFalhou, setSecoesTentativaFalhou] = useState<Set<number>>(new Set());

  function tentarAvancarSecao(numero: number, completo: boolean) {
    if (!completo) {
      setSecoesTentativaFalhou((atual) => new Set(atual).add(numero));
      return;
    }
    setSecoesTentativaFalhou((atual) => {
      if (!atual.has(numero)) return atual;
      const novo = new Set(atual);
      novo.delete(numero);
      return novo;
    });
    avancarSecao();
  }

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
      razaoSocial,
      nomeFantasia,
      contratoSocial,
      origem,
      executivoId: executivoIdSalvo,
      associacaoId: associacaoIdSalvo,
      eventoId: eventoIdSalvo,
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
        setFaseSubmit("recebido");
        // Cadastro já persistido de verdade no banco — o rascunho salvo
        // localmente (autosave) não tem mais função, limpa. O resultado da
        // análise (fase do overlay) já foi guardado acima em faseSubmit,
        // estado local independente da store — pode zerar a store (e os
        // dados extraídos por IA que ficaram em memória) sem afetar o que
        // é exibido pro usuário.
        void useCadastroWizardStore.persist.clearStorage();
        resetWizardStore();
        setContratoSocialErro(null);
        setSociosArquivoErros({});
        setSociosAnaliseIdentificacao({});
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
    secoesTentativaFalhou,
    tentarAvancarSecao,

    executivos,
    associacoes,
    executivoIdSelecionado: executivoIdSalvo,
    associacaoIdSelecionado: associacaoIdSalvo,
    executivoTravado,
    associacaoTravado,
    setExecutivoId,
    setAssociacaoId,

    cnpj,
    cnpjStatus,
    avisoAlfanumerico,
    verificandoCnpjCadastrado,
    cnpjJaCadastrado,
    contratoSocial,
    contratoSocialErro,
    analisandoContratoSocial,
    contratoSocialAnalise,
    razaoSocial,
    nomeFantasia,
    setRazaoSocial,
    setNomeFantasia,
    setCnpj,
    setContratoSocial,
    cnpjCompleto,
    empresaCamposDesbloqueados,
    empresaCompleta,
    camposFaltantesEmpresa,

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
    sociosCompletos,
    sociosCamposFaltantes,
    socioCepBuscando,
    addSocio,
    removeSocio,
    updateSocio,
    toggleRepresentante,
    buscarCepSocio,

    enderecoBanco,
    enderecoBancoCepBuscando,
    enderecoCompleto,
    camposFaltantesEndereco,
    bancoCompleto,
    camposFaltantesBanco,
    updateEnderecoBanco,
    buscarCepEnderecoBanco,
    bancos,
    bancosCarregando,

    documentosPendentes,
    isSubmitting,
    submitError,
    submitDuplicado,
    submit,
    faseSubmit,
  };
}
