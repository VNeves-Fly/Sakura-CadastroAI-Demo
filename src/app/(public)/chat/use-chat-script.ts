"use client";

import { useEffect, useRef, useState } from "react";
import { validarCnpjComMensagem, unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { validarCpfComMensagem, maskCpf } from "@/modules/cadastro/utils/cpf.util";
import { validarTelefone, maskTelefone } from "@/modules/shared/utils/telefone.util";
import { validarEmail } from "@/modules/shared/utils/email.util";
import { unmaskCep } from "@/modules/cadastro/utils/cep.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import {
  BANCOS_BRASILEIROS,
  TIPO_CONTA_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import { gerarEmpresaMock, decisaoFinalMock } from "./mock-empresa";
import { resolverEnderecoMock } from "./mock-endereco";
import type { ChatMessage, ContextoChat, PendingInput } from "./types";

function contextoVazio(): ContextoChat {
  return {
    cnpj: "",
    razaoSocial: "",
    socios: [],
    socioAtualIndex: null,
    enderecoAgenciaResumo: null,
    banco: null,
    contratoSocialNome: null,
  };
}

function aguardar(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Roteiro do chat: protótipo visual isolado (decisão do usuário,
// 2026-07-17) — nenhuma chamada a adapter/service/use-case real. CNPJ,
// CPF, telefone e e-mail usam os mesmos validadores puros do wizard
// real; empresa/sócios e endereço são gerados por semente
// determinística a partir do CNPJ/CEP (mock-empresa.ts / mock-endereco.ts),
// só pra a demonstração ser consistente entre execuções.
export function useChatScript() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingInput | null>(null);
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
        telefone: "",
        email: "",
        estadoCivil: "",
        estadoCivilLabel: "",
        enderecoResumo: null,
        documentoNome: null,
      })),
    };

    await falarBot(`Muito obrigado! Localizamos o CNPJ da ${empresa.razaoSocial}.`);
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
    const indice = contextoRef.current.socioAtualIndex!;
    contextoRef.current.socios[indice]!.cpf = maskCpf(valorDigitado);
    await falarBot("Ótimo, digite o telefone com (DDD) 9XXXX-XXXX");
    setPending({ kind: "texto", tag: "telefone", placeholder: "(11) 99999-9999" });
  }

  async function receberTelefone(valorDigitado: string) {
    if (!validarTelefone(valorDigitado, "BR")) {
      await falarBot(
        "Esse telefone não parece completo. Pode digitar novamente no formato (DDD) 9XXXX-XXXX?",
      );
      setPending({ kind: "texto", tag: "telefone", placeholder: "(11) 99999-9999" });
      return;
    }
    const indice = contextoRef.current.socioAtualIndex!;
    contextoRef.current.socios[indice]!.telefone = maskTelefone(valorDigitado, "BR");
    await falarBot("Qual o e-mail do sócio?");
    setPending({ kind: "texto", tag: "email", placeholder: "socio@email.com" });
  }

  async function receberEmail(valorDigitado: string) {
    if (!validarEmail(valorDigitado)) {
      await falarBot("Esse e-mail não parece válido. Pode conferir e digitar novamente?");
      setPending({ kind: "texto", tag: "email", placeholder: "socio@email.com" });
      return;
    }
    const indice = contextoRef.current.socioAtualIndex!;
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
      campos: [
        { nome: "cep", label: "CEP", tipo: "text", placeholder: "00000-000", obrigatorio: true },
        { nome: "numero", label: "Número", tipo: "text", placeholder: "100", obrigatorio: true },
      ],
    });
  }

  async function receberEnderecoSocio(valores: Record<string, string | boolean>) {
    const cep = String(valores.cep ?? "");
    const numero = String(valores.numero ?? "");
    const endereco = resolverEnderecoMock(unmaskCep(cep));
    const resumo = `${endereco.logradouro}, ${numero} — ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`;
    const indice = contextoRef.current.socioAtualIndex!;
    contextoRef.current.socios[indice]!.enderecoResumo = resumo;

    await falarBot(`Endereço registrado: ${resumo}`);
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
    setPending({
      kind: "quick-replies",
      tag: "endereco_mesmo_socio",
      opcoes: [
        { valor: "sim", label: "Sim" },
        { valor: "nao", label: "Não" },
      ],
    });
  }

  async function responderEnderecoMesmoSocio(valor: string) {
    const ctx = contextoRef.current;
    if (valor === "nao") {
      await falarBot("Sem problemas, me informe o CEP e o número do endereço da agência.");
      setPending({
        kind: "inline-form",
        tag: "endereco_agencia",
        titulo: "Endereço da agência",
        campos: [
          { nome: "cep", label: "CEP", tipo: "text", placeholder: "00000-000", obrigatorio: true },
          { nome: "numero", label: "Número", tipo: "text", placeholder: "100", obrigatorio: true },
        ],
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
    const cep = String(valores.cep ?? "");
    const numero = String(valores.numero ?? "");
    const endereco = resolverEnderecoMock(unmaskCep(cep));
    const resumo = `${endereco.logradouro}, ${numero} — ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`;
    contextoRef.current.enderecoAgenciaResumo = resumo;
    await falarBot(`Endereço da agência registrado: ${resumo}`);
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

  async function confirmarEnvio() {
    await falarBot("Ok, vamos analisar seu cadastro. Aguarde um momento...", 1800);
    const ctx = contextoRef.current;
    const decisao = decisaoFinalMock(ctx.cnpj);

    if (decisao === "aprovado") {
      const emails = ctx.socios.map((s) => s.email);
      const destino =
        emails.length === 1
          ? `para o e-mail ${emails[0]}`
          : `para os e-mails dos sócios (${emails.join(", ")})`;
      await falarBot(
        `🎉 Parabéns! Seu cadastro foi aprovado. O contrato está sendo encaminhado ${destino}.`,
      );
    } else {
      await falarBot(
        "Seu cadastro precisou de uma análise mais detalhada. Em breve nossa equipe de cadastro entrará em contato solicitando mais detalhes.",
      );
    }

    setPending({
      kind: "quick-replies",
      tag: "reiniciar",
      opcoes: [{ valor: "reiniciar", label: "Começar um novo cadastro" }],
    });
  }

  function reiniciar() {
    contextoRef.current = contextoVazio();
    setMessages([]);
    void iniciar();
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
    else if (tag === "telefone") await receberTelefone(valor);
    else if (tag === "email") await receberEmail(valor);
  }

  async function onQuickReply(valor: string) {
    if (!pending || pending.kind !== "quick-replies") return;
    const tag = pending.tag;
    const opcaoEscolhida = pending.opcoes.find((o) => o.valor === valor);
    pushUserTexto(opcaoEscolhida?.label ?? valor);
    setPending(null);

    if (tag === "escolha_socio") await escolherSocio(Number(valor));
    else if (tag === "estado_civil")
      await escolherEstadoCivil(valor, opcaoEscolhida?.label ?? valor);
    else if (tag === "endereco_mesmo_socio") await responderEnderecoMesmoSocio(valor);
    else if (tag === "endereco_qual_socio") await escolherSocioParaEndereco(Number(valor));
    else if (tag === "confirmar_envio") await confirmarEnvio();
    else if (tag === "reiniciar") reiniciar();
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

  return { messages, pending, onEnviarTexto, onQuickReply, onEnviarForm, onEnviarArquivo };
}
