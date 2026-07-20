"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validarCnpjComMensagem, unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { validarCpfComMensagem, maskCpf, unmaskCpf } from "@/modules/cadastro/utils/cpf.util";
import { validarEmail } from "@/modules/shared/utils/email.util";
import { unmaskCep } from "@/modules/cadastro/utils/cep.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import {
  BANCOS_BRASILEIROS,
  TIPO_CONTA_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import { gerarEmpresaMock, decisaoFinalMock, limparNomeSocial } from "./mock-empresa";
import { resolverEnderecoMock } from "./mock-endereco";
import { telefoneChatValido, maskTelefoneChat } from "./format-telefone";
import type {
  ChatMessage,
  ContextoChat,
  FaseChat,
  PendingInput,
  ResultadoFinalChat,
  TelefoneChat,
} from "./types";

function contextoVazio(): ContextoChat {
  return {
    cnpj: "",
    razaoSocial: "",
    contratoSocialNome: null,
    telefoneComercial: null,
    emailContato: "",
    emailComercialDiferente: false,
    emailComercial: null,
    emailFinanceiroDiferente: false,
    emailFinanceiro: null,
    socios: [],
    socioAtualIndex: null,
    temProcurador: null,
    procurador: null,
    enderecoSocioPendente: null,
    enderecoProcuradorPendente: null,
    enderecoAgenciaPendente: null,
    enderecoAgenciaResumo: null,
    banco: null,
  };
}

const CAMPOS_ENDERECO = [
  { nome: "cep", label: "CEP", tipo: "text" as const, placeholder: "00000000", obrigatorio: true },
  { nome: "numero", label: "Número", tipo: "text" as const, placeholder: "100", obrigatorio: true },
];

const OPCOES_SIM_NAO = [
  { valor: "sim", label: "Sim" },
  { valor: "nao", label: "Não" },
];

function aguardar(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Depois de 3 erros seguidos (em qualquer campo — o contador zera a cada
// resposta válida), o roteiro desiste de insistir na validação e oferece
// atendimento humano via WhatsApp em vez de repetir a mesma pergunta.
const LIMITE_ERROS_CONSECUTIVOS = 3;

// Roteiro do chat: protótipo visual isolado (decisão do usuário,
// 2026-07-17) — nenhuma chamada a adapter/service/use-case real. CNPJ,
// CPF e e-mail usam os mesmos validadores puros do wizard real;
// empresa/sócios e endereço são gerados por semente determinística a
// partir do CNPJ/CEP (mock-empresa.ts / mock-endereco.ts).
export function useChatScript() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingInput | null>(null);
  const [fase, setFase] = useState<FaseChat>("chat");
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoFinalChat | null>(null);
  const contextoRef = useRef<ContextoChat>(contextoVazio());
  const idCounterRef = useRef(0);
  const iniciouRef = useRef(false);
  const errosConsecutivosRef = useRef(0);
  const router = useRouter();

  // Sub-fluxo de telefone (tipo → número → WhatsApp se celular) é
  // idêntico pra empresa/sócio/procurador — a continuação decide onde
  // salvar o resultado e qual o próximo passo.
  const telefoneContinuacaoRef = useRef<((telefone: TelefoneChat) => Promise<void>) | null>(null);
  const telefoneParcialRef = useRef<TelefoneChat | null>(null);

  function nextId(): string {
    idCounterRef.current += 1;
    return `msg-${idCounterRef.current}`;
  }

  function pushUserTexto(conteudo: string) {
    setMessages((atual) => [...atual, { id: nextId(), autor: "user", tipo: "texto", conteudo }]);
  }

  function pushUserArquivo(nomeArquivo: string) {
    setMessages((atual) => [
      ...atual,
      { id: nextId(), autor: "user", tipo: "arquivo", nomeArquivo },
    ]);
  }

  function pushBotLoading(): string {
    const id = nextId();
    setMessages((atual) => [...atual, { id, autor: "bot", tipo: "loading" }]);
    return id;
  }

  async function falarBot(conteudo: string, delayMs?: number) {
    const id = pushBotLoading();
    await aguardar(delayMs ?? 700 + Math.random() * 500);
    setMessages((atual) =>
      atual.map((m) => (m.id === id ? { id, autor: "bot", tipo: "texto", conteudo } : m)),
    );
    await aguardar(50);
  }

  async function falarBotResumo(itens: string[], delayMs = 900) {
    const id = pushBotLoading();
    await aguardar(delayMs);
    setMessages((atual) =>
      atual.map((m) => (m.id === id ? { id, autor: "bot", tipo: "resumo", itens } : m)),
    );
  }

  function cpfDuplicadoEntreSocios(limpo: string, indiceExcluir: number | null): boolean {
    return contextoRef.current.socios.some(
      (s, i) => i !== indiceExcluir && s.cpf !== "" && unmaskCpf(s.cpf) === limpo,
    );
  }

  function emailDuplicadoEntreSocios(normalizado: string, indiceExcluir: number | null): boolean {
    return contextoRef.current.socios.some(
      (s, i) => i !== indiceExcluir && s.email !== "" && s.email.toLowerCase() === normalizado,
    );
  }

  // ---------- Validação com limite de tentativas ----------

  // Centraliza todo ponto de "resposta inválida, tente de novo" do
  // roteiro — em vez de cada função decidir sozinha se repete a
  // pergunta, aqui é onde o contador de erros consecutivos vive. Retorna
  // true (siga em frente) ou false (já tratou o que fazer: repetiu a
  // pergunta ou acionou o fallback de WhatsApp).
  async function validarOuFalhar(
    valido: boolean,
    mensagemErro: string,
    pendingReenviar: PendingInput,
  ): Promise<boolean> {
    if (valido) {
      errosConsecutivosRef.current = 0;
      return true;
    }

    errosConsecutivosRef.current += 1;
    if (errosConsecutivosRef.current >= LIMITE_ERROS_CONSECUTIVOS) {
      await ativarFallbackWhatsapp();
      return false;
    }

    await falarBot(mensagemErro);
    setPending(pendingReenviar);
    return false;
  }

  async function ativarFallbackWhatsapp() {
    errosConsecutivosRef.current = 0;
    await falarBot(
      "Estou vendo que está com dificuldade para responder. Informe seu WhatsApp e um analista entrará em contato contigo para auxiliar no cadastro.",
    );
    setPending({ kind: "texto", tag: "whatsapp_fallback", placeholder: "(11) 99999-9999" });
  }

  // Sem limite de tentativas aqui de propósito — já estamos no fallback
  // porque o roteiro automático não deu certo; travar o usuário de novo
  // seria o oposto do objetivo.
  async function receberWhatsappFallback(valorDigitado: string) {
    if (!telefoneChatValido(valorDigitado, "celular")) {
      await falarBot(
        "Esse número não parece completo. Pode digitar seu WhatsApp com DDD, no formato (11) 99999-9999?",
      );
      setPending({ kind: "texto", tag: "whatsapp_fallback", placeholder: "(11) 99999-9999" });
      return;
    }

    await falarBot("Estamos registrando seu número...");
    await aguardar(3000);
    setResultadoFinal({
      tipo: "manual",
      titulo: "Vamos continuar por WhatsApp!",
      mensagem: "Um analista da Sakura vai entrar em contato por lá para concluir seu cadastro.",
    });
    setFase("resultado");
  }

  // ---------- Início / Empresa ----------

  async function iniciar() {
    await falarBot(
      "Olá! Seja bem-vindo(a) à Sakura Consolidadora. Eu sou a assistente virtual e vou te ajudar com o cadastro da sua agência.",
      600,
    );
    await falarBot("Você prefere continuar por aqui, no chat, ou preencher um formulário?");
    setPending({
      kind: "quick-replies",
      tag: "escolha_modo_inicial",
      opcoes: [
        { valor: "chat", label: "Continuar no chat" },
        { valor: "formulario", label: "Preencher formulário" },
      ],
    });
  }

  async function escolherModoInicial(valor: string) {
    if (valor === "formulario") {
      await falarBot("Estamos enviando seu cadastro para o formulário...");
      await aguardar(3000);
      router.push("/cadastro");
      return;
    }

    await falarBot("Combinado! Para prosseguir, digite o CNPJ da agência.");
    setPending({ kind: "texto", tag: "cnpj", placeholder: "00.000.000/0000-00" });
  }

  useEffect(() => {
    if (iniciouRef.current) return;
    iniciouRef.current = true;
    void iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function receberCnpj(valorDigitado: string) {
    const { valido } = validarCnpjComMensagem(valorDigitado);
    const ok = await validarOuFalhar(
      valido,
      "Hmm, não conseguimos validar esse CNPJ. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "cnpj", placeholder: "00.000.000/0000-00" },
    );
    if (!ok) return;

    const limpo = unmaskCnpj(valorDigitado);
    const empresa = gerarEmpresaMock(limpo);
    const nomeSocial = limparNomeSocial(empresa.razaoSocial);
    contextoRef.current = {
      ...contextoVazio(),
      cnpj: limpo,
      razaoSocial: nomeSocial,
      socios: empresa.socios.map((s) => ({
        nome: s.nome,
        cpf: "",
        email: "",
        telefone: null,
        estadoCivil: "",
        estadoCivilLabel: "",
        enderecoResumo: null,
        documentoNome: null,
      })),
    };

    await falarBot(`Seja bem-vindo(a), ${nomeSocial.toUpperCase()}! É um prazer falar com você.`);
    await falarBot("Pode me enviar o contrato social da agência?");
    setPending({
      kind: "arquivo",
      tag: "contrato_social_empresa",
      instrucao: "Contrato social (PDF)",
    });
  }

  async function receberContratoSocialEmpresa(nomeArquivo: string) {
    contextoRef.current.contratoSocialNome = nomeArquivo;
    await perguntarTelefoneComercial();
  }

  async function perguntarTelefoneComercial() {
    await falarBot("Gostaria de adicionar um telefone comercial?");
    setPending({
      kind: "quick-replies",
      tag: "telefone_comercial_pergunta",
      opcoes: OPCOES_SIM_NAO,
    });
  }

  async function responderTelefoneComercial(valor: string) {
    if (valor === "nao") {
      await irParaEmailContato();
      return;
    }
    await pedirTelefone(async (telefone) => {
      contextoRef.current.telefoneComercial = telefone;
      await irParaEmailContato();
    });
  }

  async function irParaEmailContato() {
    await falarBot("Qual o e-mail de contato da agência?");
    setPending({ kind: "texto", tag: "email_contato", placeholder: "contato@agencia.com.br" });
  }

  async function receberEmailContato(valorDigitado: string) {
    const ok = await validarOuFalhar(
      validarEmail(valorDigitado),
      "Esse e-mail não parece válido. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "email_contato", placeholder: "contato@agencia.com.br" },
    );
    if (!ok) return;
    contextoRef.current.emailContato = valorDigitado.trim();
    await falarBot("Existe algum e-mail diferente pro comercial ou financeiro?");
    setPending({
      kind: "inline-form",
      tag: "email_flags",
      titulo: "E-mails adicionais",
      campos: [
        { nome: "comercialDiferente", label: "E-mail comercial diferente", tipo: "checkbox" },
        { nome: "financeiroDiferente", label: "E-mail financeiro diferente", tipo: "checkbox" },
      ],
    });
  }

  async function receberEmailFlags(valores: Record<string, string | boolean>) {
    contextoRef.current.emailComercialDiferente = Boolean(valores.comercialDiferente);
    contextoRef.current.emailFinanceiroDiferente = Boolean(valores.financeiroDiferente);
    await avancarEmailsAdicionais();
  }

  async function avancarEmailsAdicionais() {
    const ctx = contextoRef.current;
    if (ctx.emailComercialDiferente && ctx.emailComercial === null) {
      await falarBot("Qual o e-mail comercial?");
      setPending({
        kind: "texto",
        tag: "email_comercial",
        placeholder: "comercial@agencia.com.br",
      });
      return;
    }
    if (ctx.emailFinanceiroDiferente && ctx.emailFinanceiro === null) {
      await falarBot("Qual o e-mail financeiro?");
      setPending({
        kind: "texto",
        tag: "email_financeiro",
        placeholder: "financeiro@agencia.com.br",
      });
      return;
    }
    await irParaEscolhaSocio();
  }

  async function receberEmailComercial(valorDigitado: string) {
    const ok = await validarOuFalhar(
      validarEmail(valorDigitado),
      "Esse e-mail não parece válido. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "email_comercial", placeholder: "comercial@agencia.com.br" },
    );
    if (!ok) return;
    contextoRef.current.emailComercial = valorDigitado.trim();
    await avancarEmailsAdicionais();
  }

  async function receberEmailFinanceiro(valorDigitado: string) {
    const ok = await validarOuFalhar(
      validarEmail(valorDigitado),
      "Esse e-mail não parece válido. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "email_financeiro", placeholder: "financeiro@agencia.com.br" },
    );
    if (!ok) return;
    contextoRef.current.emailFinanceiro = valorDigitado.trim();
    await avancarEmailsAdicionais();
  }

  // ---------- Telefone (sub-fluxo compartilhado) ----------

  async function pedirTelefone(
    continuar: (telefone: TelefoneChat) => Promise<void>,
    pergunta = "Esse telefone é fixo ou celular?",
  ) {
    telefoneContinuacaoRef.current = continuar;
    await falarBot(pergunta);
    setPending({
      kind: "quick-replies",
      tag: "tipo_telefone",
      opcoes: [
        { valor: "celular", label: "Celular" },
        { valor: "fixo", label: "Telefone fixo" },
      ],
    });
  }

  async function escolherTipoTelefone(tipo: "fixo" | "celular") {
    const placeholder = tipo === "celular" ? "(11) 99999-9999" : "(11) 3333-4444";
    await falarBot(`Digite o número no formato ${placeholder}`);
    setPending({
      kind: "texto",
      tag: tipo === "celular" ? "telefone_celular" : "telefone_fixo",
      placeholder,
    });
  }

  async function receberTelefoneNumero(valorDigitado: string, tipo: "fixo" | "celular") {
    const placeholder = tipo === "celular" ? "(11) 99999-9999" : "(11) 3333-4444";
    const rotulo = tipo === "celular" ? "celular" : "telefone fixo";
    const ok = await validarOuFalhar(
      telefoneChatValido(valorDigitado, tipo),
      `Esse número não parece um ${rotulo} válido. Pode digitar novamente no formato ${placeholder}?`,
      {
        kind: "texto",
        tag: tipo === "celular" ? "telefone_celular" : "telefone_fixo",
        placeholder,
      },
    );
    if (!ok) return;

    const telefone: TelefoneChat = {
      tipo,
      numero: maskTelefoneChat(valorDigitado, tipo),
      whatsapp: null,
    };

    if (tipo === "celular") {
      telefoneParcialRef.current = telefone;
      await falarBot("Esse celular é WhatsApp?");
      setPending({ kind: "quick-replies", tag: "confirma_whatsapp", opcoes: OPCOES_SIM_NAO });
      return;
    }

    await concluirTelefone(telefone);
  }

  async function responderWhatsapp(valor: string) {
    const telefone = telefoneParcialRef.current!;
    telefone.whatsapp = valor === "sim";
    telefoneParcialRef.current = null;
    await concluirTelefone(telefone);
  }

  async function concluirTelefone(telefone: TelefoneChat) {
    const continuar = telefoneContinuacaoRef.current;
    telefoneContinuacaoRef.current = null;
    await continuar?.(telefone);
  }

  // ---------- Sócios ----------

  async function irParaEscolhaSocio() {
    const ctx = contextoRef.current;
    const pendentes = ctx.socios.map((s, i) => ({ s, i })).filter(({ s }) => !s.documentoNome);

    if (pendentes.length === 0) {
      await perguntarProcurador();
      return;
    }

    const mensagem =
      pendentes.length === ctx.socios.length
        ? `Vamos prosseguir com o cadastro dos sócios. Encontramos ${ctx.socios.length} sócio(s) no quadro societário. Qual gostaria de preencher primeiro?`
        : "Show, vamos para o próximo sócio.";
    await falarBot(mensagem);
    setPending({
      kind: "quick-replies",
      tag: "escolha_socio",
      opcoes: pendentes.map(({ s, i }) => ({ valor: String(i), label: s.nome })),
    });
  }

  async function escolherSocio(indice: number) {
    contextoRef.current.socioAtualIndex = indice;
    const nome = contextoRef.current.socios[indice]!.nome;
    await falarBot(`Perfeito. Me informe o CPF do sócio ${nome}.`);
    setPending({ kind: "texto", tag: "cpf", placeholder: "000.000.000-00" });
  }

  async function receberCpf(valorDigitado: string) {
    const { valido } = validarCpfComMensagem(valorDigitado);
    const okValido = await validarOuFalhar(
      valido,
      "Hmm, esse CPF não parece válido. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "cpf", placeholder: "000.000.000-00" },
    );
    if (!okValido) return;

    const limpo = unmaskCpf(valorDigitado);
    const indice = contextoRef.current.socioAtualIndex!;
    const okUnico = await validarOuFalhar(
      !cpfDuplicadoEntreSocios(limpo, indice),
      "Esse CPF já foi informado para outro sócio deste cadastro. Cada sócio precisa de um CPF diferente — pode conferir e digitar novamente?",
      { kind: "texto", tag: "cpf", placeholder: "000.000.000-00" },
    );
    if (!okUnico) return;

    contextoRef.current.socios[indice]!.cpf = maskCpf(valorDigitado);
    await falarBot("Qual o e-mail do sócio?");
    setPending({ kind: "texto", tag: "email", placeholder: "socio@email.com" });
  }

  async function receberEmail(valorDigitado: string) {
    const okValido = await validarOuFalhar(
      validarEmail(valorDigitado),
      "Esse e-mail não parece válido. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "email", placeholder: "socio@email.com" },
    );
    if (!okValido) return;

    const normalizado = valorDigitado.trim().toLowerCase();
    const indice = contextoRef.current.socioAtualIndex!;
    const okUnico = await validarOuFalhar(
      !emailDuplicadoEntreSocios(normalizado, indice),
      "Esse e-mail já está sendo usado por outro sócio deste cadastro. Pode informar um e-mail diferente?",
      { kind: "texto", tag: "email", placeholder: "socio@email.com" },
    );
    if (!okUnico) return;

    contextoRef.current.socios[indice]!.email = valorDigitado.trim();
    await falarBot("Qual o estado civil?");
    setPending({
      kind: "quick-replies",
      tag: "estado_civil",
      opcoes: ESTADO_CIVIL_OPCOES.map((o) => ({ valor: o.valor, label: o.label })),
    });
  }

  async function escolherEstadoCivil(valor: string, label: string) {
    const indice = contextoRef.current.socioAtualIndex!;
    contextoRef.current.socios[indice]!.estadoCivil = valor;
    contextoRef.current.socios[indice]!.estadoCivilLabel = label;

    await pedirTelefone(async (telefone) => {
      const i = contextoRef.current.socioAtualIndex!;
      contextoRef.current.socios[i]!.telefone = telefone;
      await falarBot("Show, agora me informe o CEP e o número do endereço do sócio.");
      setPending({
        kind: "inline-form",
        tag: "endereco_socio",
        titulo: "Endereço do sócio",
        campos: CAMPOS_ENDERECO,
      });
    }, "O telefone do sócio é fixo ou celular?");
  }

  function resumoEndereco(cep: string, numero: string): string {
    const endereco = resolverEnderecoMock(unmaskCep(cep));
    return `${endereco.logradouro}, ${numero} — ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`;
  }

  async function receberEnderecoSocio(valores: Record<string, string | boolean>) {
    const resumo = resumoEndereco(String(valores.cep ?? ""), String(valores.numero ?? ""));
    contextoRef.current.enderecoSocioPendente = resumo;
    await falarBot(`Encontramos este endereço: ${resumo}. Está correto?`);
    setPending({
      kind: "quick-replies",
      tag: "confirmar_endereco_socio",
      opcoes: [
        { valor: "confirmar", label: "Confirmar" },
        { valor: "editar", label: "Editar" },
      ],
    });
  }

  async function confirmarEnderecoSocio(valor: string) {
    if (valor === "editar") {
      await falarBot("Sem problemas, me informe novamente o CEP e o número do endereço do sócio.");
      setPending({
        kind: "inline-form",
        tag: "endereco_socio",
        titulo: "Endereço do sócio",
        campos: CAMPOS_ENDERECO,
      });
      return;
    }

    const indice = contextoRef.current.socioAtualIndex!;
    contextoRef.current.socios[indice]!.enderecoResumo = contextoRef.current.enderecoSocioPendente;
    await falarBot("Agora envie uma foto ou PDF do RG do sócio.");
    setPending({ kind: "arquivo", tag: "documento_socio", instrucao: "RG (PDF ou imagem)" });
  }

  async function receberDocumentoSocio(nomeArquivo: string) {
    const indice = contextoRef.current.socioAtualIndex!;
    contextoRef.current.socios[indice]!.documentoNome = nomeArquivo;
    contextoRef.current.socioAtualIndex = null;
    await irParaEscolhaSocio();
  }

  // ---------- Procurador ----------

  async function perguntarProcurador() {
    await falarBot("Existe algum procurador?");
    setPending({ kind: "quick-replies", tag: "tem_procurador", opcoes: OPCOES_SIM_NAO });
  }

  async function responderTemProcurador(valor: string) {
    contextoRef.current.temProcurador = valor === "sim";
    if (valor === "nao") {
      await perguntarEnderecoAgencia();
      return;
    }

    contextoRef.current.procurador = {
      nome: "",
      cpf: "",
      email: "",
      telefone: null,
      enderecoResumo: null,
      rgArquivoNome: null,
      procuracaoArquivoNome: null,
    };
    await falarBot(
      "Combinado! Vou precisar de uma procuração válida e do RG do procurador. Qual o nome completo dele(a)?",
    );
    setPending({ kind: "texto", tag: "procurador_nome", placeholder: "Nome completo" });
  }

  async function receberNomeProcurador(valorDigitado: string) {
    contextoRef.current.procurador!.nome = valorDigitado.trim();
    await falarBot(`Perfeito. Me informe o CPF de ${contextoRef.current.procurador!.nome}.`);
    setPending({ kind: "texto", tag: "cpf_procurador", placeholder: "000.000.000-00" });
  }

  async function receberCpfProcurador(valorDigitado: string) {
    const { valido } = validarCpfComMensagem(valorDigitado);
    const okValido = await validarOuFalhar(
      valido,
      "Hmm, esse CPF não parece válido. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "cpf_procurador", placeholder: "000.000.000-00" },
    );
    if (!okValido) return;

    const limpo = unmaskCpf(valorDigitado);
    const okUnico = await validarOuFalhar(
      !cpfDuplicadoEntreSocios(limpo, null),
      "Esse CPF já foi informado por um dos sócios. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "cpf_procurador", placeholder: "000.000.000-00" },
    );
    if (!okUnico) return;

    contextoRef.current.procurador!.cpf = maskCpf(valorDigitado);
    await falarBot("Qual o e-mail do procurador?");
    setPending({ kind: "texto", tag: "email_procurador", placeholder: "procurador@email.com" });
  }

  async function receberEmailProcurador(valorDigitado: string) {
    const okValido = await validarOuFalhar(
      validarEmail(valorDigitado),
      "Esse e-mail não parece válido. Pode conferir e digitar novamente?",
      { kind: "texto", tag: "email_procurador", placeholder: "procurador@email.com" },
    );
    if (!okValido) return;

    const normalizado = valorDigitado.trim().toLowerCase();
    const okUnico = await validarOuFalhar(
      !emailDuplicadoEntreSocios(normalizado, null),
      "Esse e-mail já está sendo usado por um dos sócios. Pode informar um e-mail diferente?",
      { kind: "texto", tag: "email_procurador", placeholder: "procurador@email.com" },
    );
    if (!okUnico) return;

    contextoRef.current.procurador!.email = valorDigitado.trim();
    await pedirTelefone(async (telefone) => {
      contextoRef.current.procurador!.telefone = telefone;
      await falarBot("Show, agora me informe o CEP e o número do endereço do procurador.");
      setPending({
        kind: "inline-form",
        tag: "endereco_procurador",
        titulo: "Endereço do procurador",
        campos: CAMPOS_ENDERECO,
      });
    }, "O telefone do procurador é fixo ou celular?");
  }

  async function receberEnderecoProcurador(valores: Record<string, string | boolean>) {
    const resumo = resumoEndereco(String(valores.cep ?? ""), String(valores.numero ?? ""));
    contextoRef.current.enderecoProcuradorPendente = resumo;
    await falarBot(`Encontramos este endereço: ${resumo}. Está correto?`);
    setPending({
      kind: "quick-replies",
      tag: "confirmar_endereco_procurador",
      opcoes: [
        { valor: "confirmar", label: "Confirmar" },
        { valor: "editar", label: "Editar" },
      ],
    });
  }

  async function confirmarEnderecoProcurador(valor: string) {
    if (valor === "editar") {
      await falarBot(
        "Sem problemas, me informe novamente o CEP e o número do endereço do procurador.",
      );
      setPending({
        kind: "inline-form",
        tag: "endereco_procurador",
        titulo: "Endereço do procurador",
        campos: CAMPOS_ENDERECO,
      });
      return;
    }

    contextoRef.current.procurador!.enderecoResumo = contextoRef.current.enderecoProcuradorPendente;
    await falarBot("Envie o RG do procurador.");
    setPending({
      kind: "arquivo",
      tag: "documento_rg_procurador",
      instrucao: "RG (PDF ou imagem)",
    });
  }

  async function receberRgProcurador(nomeArquivo: string) {
    contextoRef.current.procurador!.rgArquivoNome = nomeArquivo;
    await falarBot("Agora envie a procuração do procurador.");
    setPending({
      kind: "arquivo",
      tag: "documento_procuracao",
      instrucao: "Procuração válida (PDF)",
    });
  }

  async function receberProcuracao(nomeArquivo: string) {
    contextoRef.current.procurador!.procuracaoArquivoNome = nomeArquivo;
    await perguntarEnderecoAgencia();
  }

  // ---------- Endereço e dados bancários da agência ----------

  async function perguntarEnderecoAgencia() {
    await falarBot("Agora vamos falar da agência. O endereço da agência é o mesmo de algum sócio?");
    setPending({ kind: "quick-replies", tag: "endereco_mesmo_socio", opcoes: OPCOES_SIM_NAO });
  }

  async function responderEnderecoMesmoSocio(valor: string) {
    const ctx = contextoRef.current;
    if (valor === "nao") {
      await falarBot("Sem problemas, me informe o CEP e o número do endereço da agência.");
      setPending({
        kind: "inline-form",
        tag: "endereco_agencia",
        titulo: "Endereço da agência",
        campos: CAMPOS_ENDERECO,
      });
      return;
    }

    if (ctx.socios.length === 1) {
      ctx.enderecoAgenciaResumo = ctx.socios[0]!.enderecoResumo;
      await falarBot(`Combinado, vamos usar o mesmo endereço do sócio ${ctx.socios[0]!.nome}.`);
      await irParaDadosBancarios();
      return;
    }

    await falarBot("Qual sócio tem o mesmo endereço?");
    setPending({
      kind: "quick-replies",
      tag: "endereco_qual_socio",
      opcoes: ctx.socios.map((s, i) => ({ valor: String(i), label: s.nome })),
    });
  }

  async function escolherSocioParaEndereco(indice: number) {
    const ctx = contextoRef.current;
    ctx.enderecoAgenciaResumo = ctx.socios[indice]!.enderecoResumo;
    await falarBot(`Combinado, vamos usar o mesmo endereço do sócio ${ctx.socios[indice]!.nome}.`);
    await irParaDadosBancarios();
  }

  async function receberEnderecoAgencia(valores: Record<string, string | boolean>) {
    const resumo = resumoEndereco(String(valores.cep ?? ""), String(valores.numero ?? ""));
    contextoRef.current.enderecoAgenciaPendente = resumo;
    await falarBot(`Encontramos este endereço: ${resumo}. Está correto?`);
    setPending({
      kind: "quick-replies",
      tag: "confirmar_endereco_agencia",
      opcoes: [
        { valor: "confirmar", label: "Confirmar" },
        { valor: "editar", label: "Editar" },
      ],
    });
  }

  async function confirmarEnderecoAgencia(valor: string) {
    if (valor === "editar") {
      await falarBot(
        "Sem problemas, me informe novamente o CEP e o número do endereço da agência.",
      );
      setPending({
        kind: "inline-form",
        tag: "endereco_agencia",
        titulo: "Endereço da agência",
        campos: CAMPOS_ENDERECO,
      });
      return;
    }

    contextoRef.current.enderecoAgenciaResumo = contextoRef.current.enderecoAgenciaPendente;
    await irParaDadosBancarios();
  }

  async function irParaDadosBancarios() {
    await falarBot("Agora me conte os dados bancários da agência.");
    setPending({
      kind: "inline-form",
      tag: "dados_bancarios",
      titulo: "Dados bancários",
      campos: [
        {
          nome: "banco",
          label: "Banco",
          tipo: "select",
          opcoes: BANCOS_BRASILEIROS.map((b) => ({ valor: b, label: b })),
          obrigatorio: true,
        },
        { nome: "agencia", label: "Agência", tipo: "text", placeholder: "1234", obrigatorio: true },
        {
          nome: "conta",
          label: "Conta (com dígito)",
          tipo: "text",
          placeholder: "5678-9",
          obrigatorio: true,
        },
        {
          nome: "tipoConta",
          label: "Tipo de conta",
          tipo: "select",
          opcoes: TIPO_CONTA_OPCOES.map((o) => ({ valor: o.valor, label: o.label })),
          obrigatorio: true,
        },
        { nome: "favorecidoEhEmpresa", label: "Favorecido é a própria empresa", tipo: "checkbox" },
      ],
    });
  }

  async function receberDadosBancarios(valores: Record<string, string | boolean>) {
    const tipoContaValor = String(valores.tipoConta ?? "");
    const tipoContaLabel =
      TIPO_CONTA_OPCOES.find((o) => o.valor === tipoContaValor)?.label ?? tipoContaValor;

    contextoRef.current.banco = {
      banco: String(valores.banco ?? ""),
      agencia: String(valores.agencia ?? ""),
      conta: String(valores.conta ?? ""),
      tipoContaLabel,
      favorecidoEhEmpresa: Boolean(valores.favorecidoEhEmpresa),
    };

    const banco = contextoRef.current.banco;
    await falarBot(
      `Dados bancários registrados: ${banco.banco}, agência ${banco.agencia}, conta ${banco.conta} (${tipoContaLabel}).`,
    );
    await irParaRevisao();
  }

  // ---------- Revisão e envio ----------

  async function irParaRevisao() {
    const ctx = contextoRef.current;
    await falarBot("Show! Vamos revisar tudo antes de enviar.");
    await falarBotResumo([
      `Empresa: ${ctx.razaoSocial}`,
      `Contrato social: ${ctx.contratoSocialNome}`,
      ...(ctx.telefoneComercial ? [`Telefone comercial: ${ctx.telefoneComercial.numero}`] : []),
      `E-mail de contato: ${ctx.emailContato}`,
      ...(ctx.emailComercialDiferente ? [`E-mail comercial: ${ctx.emailComercial}`] : []),
      ...(ctx.emailFinanceiroDiferente ? [`E-mail financeiro: ${ctx.emailFinanceiro}`] : []),
      ...ctx.socios.map((s) => `Sócio: ${s.nome} — CPF ${s.cpf}`),
      ...(ctx.procurador ? [`Procurador: ${ctx.procurador.nome} — CPF ${ctx.procurador.cpf}`] : []),
      `Endereço da agência: ${ctx.enderecoAgenciaResumo}`,
      `Banco: ${ctx.banco?.banco} — ag. ${ctx.banco?.agencia} / conta ${ctx.banco?.conta}`,
    ]);
    setPending({
      kind: "quick-replies",
      tag: "confirmar_envio",
      opcoes: [{ valor: "enviar", label: "Enviar cadastro" }],
    });
  }

  function confirmarEnvio() {
    setFase("analisando");
  }

  function onAnaliseConcluida() {
    const ctx = contextoRef.current;
    const decisao = decisaoFinalMock(ctx.cnpj);

    if (decisao === "aprovado") {
      setResultadoFinal({
        tipo: "aprovado",
        titulo: "Seu cadastro foi aprovado!",
        mensagem: "O link com o contrato da agência foi enviado no e-mail dos sócios cadastrados.",
      });
    } else {
      setResultadoFinal({
        tipo: "manual",
        titulo: "Seu cadastro foi encaminhado a um de nossos analistas.",
        mensagem:
          "Fique ligado! Em breve alguém da nossa equipe entrará em contato para mais detalhes.",
      });
    }

    setFase("resultado");
  }

  // ---------- Handlers públicos ----------

  async function onEnviarTexto(valorDigitado: string) {
    if (!pending || pending.kind !== "texto") return;
    const valor = valorDigitado.trim();
    if (!valor) return;
    const tag = pending.tag;
    pushUserTexto(valorDigitado);
    setPending(null);

    if (tag === "whatsapp_fallback") await receberWhatsappFallback(valor);
    else if (tag === "cnpj") await receberCnpj(valor);
    else if (tag === "email_contato") await receberEmailContato(valor);
    else if (tag === "email_comercial") await receberEmailComercial(valor);
    else if (tag === "email_financeiro") await receberEmailFinanceiro(valor);
    else if (tag === "telefone_celular") await receberTelefoneNumero(valor, "celular");
    else if (tag === "telefone_fixo") await receberTelefoneNumero(valor, "fixo");
    else if (tag === "cpf") await receberCpf(valor);
    else if (tag === "email") await receberEmail(valor);
    else if (tag === "procurador_nome") await receberNomeProcurador(valor);
    else if (tag === "cpf_procurador") await receberCpfProcurador(valor);
    else if (tag === "email_procurador") await receberEmailProcurador(valor);
  }

  async function onQuickReply(valor: string) {
    if (!pending || pending.kind !== "quick-replies") return;
    const tag = pending.tag;
    const opcaoEscolhida = pending.opcoes.find((o) => o.valor === valor);
    pushUserTexto(opcaoEscolhida?.label ?? valor);
    setPending(null);

    if (tag === "escolha_modo_inicial") await escolherModoInicial(valor);
    else if (tag === "telefone_comercial_pergunta") await responderTelefoneComercial(valor);
    else if (tag === "tipo_telefone") await escolherTipoTelefone(valor as "fixo" | "celular");
    else if (tag === "confirma_whatsapp") await responderWhatsapp(valor);
    else if (tag === "escolha_socio") await escolherSocio(Number(valor));
    else if (tag === "estado_civil")
      await escolherEstadoCivil(valor, opcaoEscolhida?.label ?? valor);
    else if (tag === "confirmar_endereco_socio") await confirmarEnderecoSocio(valor);
    else if (tag === "tem_procurador") await responderTemProcurador(valor);
    else if (tag === "confirmar_endereco_procurador") await confirmarEnderecoProcurador(valor);
    else if (tag === "endereco_mesmo_socio") await responderEnderecoMesmoSocio(valor);
    else if (tag === "endereco_qual_socio") await escolherSocioParaEndereco(Number(valor));
    else if (tag === "confirmar_endereco_agencia") await confirmarEnderecoAgencia(valor);
    else if (tag === "confirmar_envio") confirmarEnvio();
  }

  async function onEnviarForm(valores: Record<string, string | boolean>) {
    if (!pending || pending.kind !== "inline-form") return;
    const tag = pending.tag;
    setPending(null);

    if (tag === "email_flags") await receberEmailFlags(valores);
    else if (tag === "endereco_socio") await receberEnderecoSocio(valores);
    else if (tag === "endereco_procurador") await receberEnderecoProcurador(valores);
    else if (tag === "endereco_agencia") await receberEnderecoAgencia(valores);
    else if (tag === "dados_bancarios") await receberDadosBancarios(valores);
  }

  async function onEnviarArquivo(nomeArquivo: string) {
    if (!pending || pending.kind !== "arquivo") return;
    const tag = pending.tag;
    pushUserArquivo(nomeArquivo);
    setPending(null);

    if (tag === "contrato_social_empresa") await receberContratoSocialEmpresa(nomeArquivo);
    else if (tag === "documento_socio") await receberDocumentoSocio(nomeArquivo);
    else if (tag === "documento_rg_procurador") await receberRgProcurador(nomeArquivo);
    else if (tag === "documento_procuracao") await receberProcuracao(nomeArquivo);
  }

  return {
    messages,
    pending,
    fase,
    resultadoFinal,
    onEnviarTexto,
    onQuickReply,
    onEnviarForm,
    onEnviarArquivo,
    onAnaliseConcluida,
  };
}
