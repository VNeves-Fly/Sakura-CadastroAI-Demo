"use client";

import { useEffect, useRef, useState } from "react";
import { validarCnpjComMensagem, unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { validarCpfComMensagem, maskCpf, unmaskCpf } from "@/modules/cadastro/utils/cpf.util";
import { validarEmail } from "@/modules/shared/utils/email.util";
import { unmaskCep } from "@/modules/cadastro/utils/cep.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import {
  BANCOS_BRASILEIROS,
  TIPO_CONTA_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import { gerarEmpresaMock, decisaoFinalMock } from "./mock-empresa";
import { resolverEnderecoMock } from "./mock-endereco";
import { telefoneChatValido, maskTelefoneChat } from "./format-telefone";
import type {
  ChatMessage,
  ContextoChat,
  FaseChat,
  PendingInput,
  ResultadoFinalChat,
} from "./types";

function contextoVazio(): ContextoChat {
  return {
    cnpj: "",
    razaoSocial: "",
    socios: [],
    socioAtualIndex: null,
    enderecoSocioPendente: null,
    enderecoAgenciaPendente: null,
    enderecoAgenciaResumo: null,
    banco: null,
    contratoSocialNome: null,
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

// Roteiro do chat: protótipo visual isolado (decisão do usuário,
// 2026-07-17) — nenhuma chamada a adapter/service/use-case real. CNPJ,
// CPF e e-mail usam os mesmos validadores puros do wizard real;
// empresa/sócios e endereço são gerados por semente determinística a
// partir do CNPJ/CEP (mock-empresa.ts / mock-endereco.ts), só pra a
// demonstração ser consistente entre execuções.
export function useChatScript() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingInput | null>(null);
  const [fase, setFase] = useState<FaseChat>("chat");
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoFinalChat | null>(null);
  const contextoRef = useRef<ContextoChat>(contextoVazio());
  const idCounterRef = useRef(0);
  const iniciouRef = useRef(false);

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

  async function iniciar() {
    await falarBot(
      "Olá! Seja bem-vindo(a). Esta é a página de cadastro de agências da Sakura Consolidadora. Para prosseguir, digite o CNPJ da agência.",
      600,
    );
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
    if (!valido) {
      await falarBot("Hmm, não conseguimos validar esse CNPJ. Pode conferir e digitar novamente?");
      setPending({ kind: "texto", tag: "cnpj", placeholder: "00.000.000/0000-00" });
      return;
    }

    const limpo = unmaskCnpj(valorDigitado);
    const empresa = gerarEmpresaMock(limpo);
    contextoRef.current = {
      ...contextoVazio(),
      cnpj: limpo,
      razaoSocial: empresa.razaoSocial,
      socios: empresa.socios.map((s) => ({
        nome: s.nome,
        cpf: "",
        telefones: [],
        email: "",
        estadoCivil: "",
        estadoCivilLabel: "",
        enderecoResumo: null,
        documentoNome: null,
      })),
    };

    await falarBot(
      `Seja bem-vindo(a), ${empresa.razaoSocial.toUpperCase()}! Localizamos seu CNPJ.`,
    );
    await irParaEscolhaSocio();
  }

  async function irParaEscolhaSocio() {
    const ctx = contextoRef.current;
    const pendentes = ctx.socios.map((s, i) => ({ s, i })).filter(({ s }) => !s.documentoNome);

    if (pendentes.length === 0) {
      await perguntarEnderecoAgencia();
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
    if (!valido) {
      await falarBot("O CPF que você digitou não estamos encontrando. Pode redigitar?");
      setPending({ kind: "texto", tag: "cpf", placeholder: "000.000.000-00" });
      return;
    }

    const limpo = unmaskCpf(valorDigitado);
    const indice = contextoRef.current.socioAtualIndex!;
    const duplicado = contextoRef.current.socios.some(
      (s, i) => i !== indice && s.cpf !== "" && unmaskCpf(s.cpf) === limpo,
    );
    if (duplicado) {
      await falarBot(
        "Esse CPF já foi informado para outro sócio deste cadastro. Cada sócio precisa de um CPF diferente — pode conferir e digitar novamente?",
      );
      setPending({ kind: "texto", tag: "cpf", placeholder: "000.000.000-00" });
      return;
    }

    contextoRef.current.socios[indice]!.cpf = maskCpf(valorDigitado);
    await perguntarTipoTelefone();
  }

  async function perguntarTipoTelefone() {
    await falarBot("Esse telefone é fixo ou celular?");
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
    if (!telefoneChatValido(valorDigitado, tipo)) {
      const placeholder = tipo === "celular" ? "(11) 99999-9999" : "(11) 3333-4444";
      const rotulo = tipo === "celular" ? "celular" : "telefone fixo";
      await falarBot(
        `Esse número não parece um ${rotulo} válido. Pode digitar novamente no formato ${placeholder}?`,
      );
      setPending({
        kind: "texto",
        tag: tipo === "celular" ? "telefone_celular" : "telefone_fixo",
        placeholder,
      });
      return;
    }

    const indice = contextoRef.current.socioAtualIndex!;
    contextoRef.current.socios[indice]!.telefones.push({
      tipo,
      numero: maskTelefoneChat(valorDigitado, tipo),
      whatsapp: null,
    });

    if (tipo === "celular") {
      await falarBot("Esse celular é WhatsApp?");
      setPending({ kind: "quick-replies", tag: "confirma_whatsapp", opcoes: OPCOES_SIM_NAO });
      return;
    }

    await perguntarMaisTelefone();
  }

  async function responderWhatsapp(valor: string) {
    const indice = contextoRef.current.socioAtualIndex!;
    const telefones = contextoRef.current.socios[indice]!.telefones;
    telefones[telefones.length - 1]!.whatsapp = valor === "sim";
    await perguntarMaisTelefone();
  }

  async function perguntarMaisTelefone() {
    await falarBot("Deseja cadastrar mais um telefone?");
    setPending({ kind: "quick-replies", tag: "mais_telefone", opcoes: OPCOES_SIM_NAO });
  }

  async function responderMaisTelefone(valor: string) {
    if (valor === "sim") {
      await perguntarTipoTelefone();
      return;
    }
    await falarBot("Qual o e-mail do sócio?");
    setPending({ kind: "texto", tag: "email", placeholder: "socio@email.com" });
  }

  async function receberEmail(valorDigitado: string) {
    if (!validarEmail(valorDigitado)) {
      await falarBot("Esse e-mail não parece válido. Pode conferir e digitar novamente?");
      setPending({ kind: "texto", tag: "email", placeholder: "socio@email.com" });
      return;
    }

    const normalizado = valorDigitado.trim().toLowerCase();
    const indice = contextoRef.current.socioAtualIndex!;
    const duplicado = contextoRef.current.socios.some(
      (s, i) => i !== indice && s.email !== "" && s.email.toLowerCase() === normalizado,
    );
    if (duplicado) {
      await falarBot(
        "Esse e-mail já está sendo usado por outro sócio deste cadastro. Pode informar um e-mail diferente?",
      );
      setPending({ kind: "texto", tag: "email", placeholder: "socio@email.com" });
      return;
    }

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
    await falarBot("Show, agora me informe o CEP e o número do endereço do sócio.");
    setPending({
      kind: "inline-form",
      tag: "endereco_socio",
      titulo: "Endereço do sócio",
      campos: CAMPOS_ENDERECO,
    });
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
    await falarBot("Agora envie uma foto ou PDF do RG/CNH do sócio.");
    setPending({ kind: "arquivo", tag: "documento_socio", instrucao: "RG ou CNH (PDF ou imagem)" });
  }

  async function receberDocumentoSocio(nomeArquivo: string) {
    const indice = contextoRef.current.socioAtualIndex!;
    contextoRef.current.socios[indice]!.documentoNome = nomeArquivo;
    contextoRef.current.socioAtualIndex = null;
    await irParaEscolhaSocio();
  }

  async function perguntarEnderecoAgencia() {
    await falarBot("Todos os sócios foram cadastrados! Agora vamos para o endereço da agência.");
    await falarBot("O endereço da agência é o mesmo de algum sócio?");
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
    await falarBot("Por último, envie o contrato social da agência.");
    setPending({ kind: "arquivo", tag: "contrato_social", instrucao: "Contrato social (PDF)" });
  }

  async function receberContratoSocial(nomeArquivo: string) {
    contextoRef.current.contratoSocialNome = nomeArquivo;
    await irParaRevisao();
  }

  async function irParaRevisao() {
    const ctx = contextoRef.current;
    await falarBot("Show! Vamos revisar tudo antes de enviar.");
    await falarBotResumo([
      `Empresa: ${ctx.razaoSocial}`,
      ...ctx.socios.map((s) => `Sócio: ${s.nome} — CPF ${s.cpf}`),
      `Endereço da agência: ${ctx.enderecoAgenciaResumo}`,
      `Banco: ${ctx.banco?.banco} — ag. ${ctx.banco?.agencia} / conta ${ctx.banco?.conta}`,
      `Contrato social: ${ctx.contratoSocialNome}`,
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

  async function onEnviarTexto(valorDigitado: string) {
    if (!pending || pending.kind !== "texto") return;
    const valor = valorDigitado.trim();
    if (!valor) return;
    const tag = pending.tag;
    pushUserTexto(valorDigitado);
    setPending(null);

    if (tag === "cnpj") await receberCnpj(valor);
    else if (tag === "cpf") await receberCpf(valor);
    else if (tag === "telefone_celular") await receberTelefoneNumero(valor, "celular");
    else if (tag === "telefone_fixo") await receberTelefoneNumero(valor, "fixo");
    else if (tag === "email") await receberEmail(valor);
  }

  async function onQuickReply(valor: string) {
    if (!pending || pending.kind !== "quick-replies") return;
    const tag = pending.tag;
    const opcaoEscolhida = pending.opcoes.find((o) => o.valor === valor);
    pushUserTexto(opcaoEscolhida?.label ?? valor);
    setPending(null);

    if (tag === "escolha_socio") await escolherSocio(Number(valor));
    else if (tag === "tipo_telefone") await escolherTipoTelefone(valor as "fixo" | "celular");
    else if (tag === "confirma_whatsapp") await responderWhatsapp(valor);
    else if (tag === "mais_telefone") await responderMaisTelefone(valor);
    else if (tag === "estado_civil")
      await escolherEstadoCivil(valor, opcaoEscolhida?.label ?? valor);
    else if (tag === "confirmar_endereco_socio") await confirmarEnderecoSocio(valor);
    else if (tag === "endereco_mesmo_socio") await responderEnderecoMesmoSocio(valor);
    else if (tag === "endereco_qual_socio") await escolherSocioParaEndereco(Number(valor));
    else if (tag === "confirmar_endereco_agencia") await confirmarEnderecoAgencia(valor);
    else if (tag === "confirmar_envio") confirmarEnvio();
  }

  async function onEnviarForm(valores: Record<string, string | boolean>) {
    if (!pending || pending.kind !== "inline-form") return;
    const tag = pending.tag;
    setPending(null);

    if (tag === "endereco_socio") await receberEnderecoSocio(valores);
    else if (tag === "endereco_agencia") await receberEnderecoAgencia(valores);
    else if (tag === "dados_bancarios") await receberDadosBancarios(valores);
  }

  async function onEnviarArquivo(nomeArquivo: string) {
    if (!pending || pending.kind !== "arquivo") return;
    const tag = pending.tag;
    pushUserArquivo(nomeArquivo);
    setPending(null);

    if (tag === "documento_socio") await receberDocumentoSocio(nomeArquivo);
    else if (tag === "contrato_social") await receberContratoSocial(nomeArquivo);
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
