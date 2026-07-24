"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validarCnpjComMensagem, unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { validarCpfComMensagem, maskCpf, unmaskCpf } from "@/modules/cadastro/utils/cpf.util";
import { validarEmail } from "@/modules/shared/utils/email.util";
import { maskCep } from "@/modules/cadastro/utils/cep.util";
import { validarArquivoUpload } from "@/modules/cadastro/utils/arquivo-upload.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import type { SocioWizardFormValues } from "@/modules/cadastro/types/socio-wizard.types";
import { TIPO_CONTA_OPCOES } from "@/modules/cadastro/types/endereco-banco.types";
import type { Banco, EnderecoBancoFormValues } from "@/modules/cadastro/types/endereco-banco.types";
import { agenciaAdapter } from "@/modules/cadastro/adapters/agencia.adapter";
import { agenciaService } from "@/modules/cadastro/services/agencia.service";
import { cepAdapter } from "@/modules/cadastro/adapters/cep.adapter";
import { cepService } from "@/modules/cadastro/services/cep.service";
import { telefoneChatValido, maskTelefoneChat } from "./format-telefone";
import type {
  ChatMessage,
  ContextoChat,
  EnderecoResolvidoChat,
  FaseChat,
  PendingInput,
  ResultadoFinalChat,
  SocioChat,
  TelefoneChat,
} from "./types";

function contextoVazio(): ContextoChat {
  return {
    cnpj: "",
    razaoSocial: "",
    contratoSocial: null,
    contratoSocialNome: null,
    contratoSocialAnalise: null,
    telefoneComercial: null,
    emailContato: "",
    emailComercialDiferente: false,
    emailComercial: null,
    emailFinanceiroDiferente: false,
    emailFinanceiro: null,
    socios: [],
    socioAtualIndex: null,
    temProcurador: null,
    enderecoSocioPendente: null,
    enderecoAgenciaPendente: null,
    enderecoAgencia: null,
    banco: null,
  };
}

function socioChatVazio(nome: string): SocioChat {
  return {
    nome,
    cpf: "",
    email: "",
    telefone: null,
    estadoCivil: "",
    estadoCivilLabel: "",
    dataNascimento: null,
    rg: null,
    rgOrgaoEmissor: null,
    rgUf: null,
    rgArquivo: null,
    documentoNome: null,
    endereco: null,
    isRepresentante: false,
    procuracaoArquivo: null,
    procuracaoArquivoNome: null,
  };
}

const CAMPOS_ENDERECO = [
  { nome: "cep", label: "CEP", tipo: "text" as const, placeholder: "00000000", obrigatorio: true },
  { nome: "numero", label: "Número", tipo: "text" as const, placeholder: "100", obrigatorio: true },
];

// Usado quando o CEP digitado não é encontrado no ViaCEP — deixa o
// cliente completar o endereço na mão em vez de travar o cadastro
// (mesmo espírito de "nunca bloquear o preenchimento" do /cadastro).
const CAMPOS_ENDERECO_MANUAL = [
  ...CAMPOS_ENDERECO,
  {
    nome: "logradouro",
    label: "Logradouro",
    tipo: "text" as const,
    placeholder: "Rua/Avenida",
    obrigatorio: true,
  },
  {
    nome: "bairro",
    label: "Bairro",
    tipo: "text" as const,
    placeholder: "Bairro",
    obrigatorio: true,
  },
  {
    nome: "cidade",
    label: "Cidade",
    tipo: "text" as const,
    placeholder: "Cidade",
    obrigatorio: true,
  },
  { nome: "uf", label: "UF", tipo: "text" as const, placeholder: "SP", obrigatorio: true },
];

const OPCOES_SIM_NAO = [
  { valor: "sim", label: "Sim" },
  { valor: "nao", label: "Não" },
];

// Mesmo valor de DURACAO_MINIMA_ANALISE_MS do /cadastro
// (use-cadastro-wizard.view-model.ts) — mantém a tela de análise no ar
// por um tempo mínimo mesmo se a resposta real do backend voltar rápido.
const DURACAO_MINIMA_ANALISE_MS = 10000;

function aguardar(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Depois de 3 erros seguidos (em qualquer campo — o contador zera a cada
// resposta válida), o roteiro desiste de insistir na validação e oferece
// atendimento humano via WhatsApp em vez de repetir a mesma pergunta.
const LIMITE_ERROS_CONSECUTIVOS = 3;

// Roteiro do chat ligado ao backend real: usa os mesmos
// service/adapter do wizard /cadastro (agenciaService, agenciaAdapter,
// cepService, cepAdapter) — nenhuma regra de negócio nova, só uma forma
// conversacional de coletar os mesmos dados. Alertas/divergência que a
// IA retorna nunca são falados pro cliente (mesma regra aplicada no
// /cadastro) — só usados pra autopreencher o que der.
export function useChatScript() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingInput | null>(null);
  const [fase, setFase] = useState<FaseChat>("chat");
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoFinalChat | null>(null);
  // Ref (não state) de propósito — nada na UI renderiza a lista de
  // bancos diretamente, só o roteiro consome; assim a leitura dentro de
  // funções assíncronas do roteiro nunca fica presa a um valor antigo
  // capturado num closure de render passado.
  const bancosRef = useRef<Banco[]>([]);
  const bancosCarregandoRef = useRef(true);
  const contextoRef = useRef<ContextoChat>(contextoVazio());
  const idCounterRef = useRef(0);
  const iniciouRef = useRef(false);
  const errosConsecutivosRef = useRef(0);
  // Índice do sócio escolhido como representante legal, guardado só
  // entre a escolha e o recebimento da procuração (ver Fase 6).
  const representanteIndiceRef = useRef<number | null>(null);
  const router = useRouter();

  // Sub-fluxo de telefone (tipo → número → WhatsApp se celular) é
  // idêntico pra empresa/sócio — a continuação decide onde salvar o
  // resultado e qual o próximo passo.
  const telefoneContinuacaoRef = useRef<((telefone: TelefoneChat) => Promise<void>) | null>(null);
  const telefoneParcialRef = useRef<TelefoneChat | null>(null);

  // Lista de bancos carregada uma vez só, no mount — mesma ideia do
  // /cadastro (use-cadastro-wizard.view-model.ts), independente do
  // cliente já ter chegado na etapa de dados bancários ou não.
  useEffect(() => {
    let cancelado = false;

    async function carregarBancos() {
      try {
        const raw = await agenciaService.listarBancos();
        if (!cancelado) bancosRef.current = raw;
      } catch {
        if (!cancelado) bancosRef.current = [];
      } finally {
        if (!cancelado) bancosCarregandoRef.current = false;
      }
    }

    void carregarBancos();
    return () => {
      cancelado = true;
    };
  }, []);

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
  // pergunta, aqui é onde o contador de erros consecutivos vive. Também
  // usado pra falha de chamada real (rede/API fora do ar), passando
  // `valido=false` direto — conta pro mesmo limite de tentativas.
  // Retorna true (siga em frente) ou false (já tratou o que fazer:
  // repetiu a pergunta ou acionou o fallback de WhatsApp).
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

    contextoRef.current = { ...contextoVazio(), cnpj: unmaskCnpj(valorDigitado) };

    await falarBot("Perfeito! Agora pode me enviar o contrato social da agência?");
    setPending({
      kind: "arquivo",
      tag: "contrato_social_empresa",
      instrucao: "Contrato social (PDF)",
    });
  }

  async function receberContratoSocialEmpresa(arquivo: File) {
    const erro = validarArquivoUpload(arquivo, "Contrato Social");
    const arquivoValido = await validarOuFalhar(!erro, erro ?? "", {
      kind: "arquivo",
      tag: "contrato_social_empresa",
      instrucao: "Contrato social (PDF)",
    });
    if (!arquivoValido) return;

    contextoRef.current.contratoSocial = arquivo;
    contextoRef.current.contratoSocialNome = arquivo.name;

    await falarBot("Analisando o contrato social...");

    try {
      const formData = agenciaAdapter.toAnalisarContratoSocialFormData({
        cnpjMascarado: contextoRef.current.cnpj,
        contratoSocial: arquivo,
      });
      const raw = await agenciaService.analisarContratoSocial(formData);
      const analise = agenciaAdapter.toContratoSocialAnaliseView(raw);

      contextoRef.current.contratoSocialAnalise = analise;
      contextoRef.current.razaoSocial = analise.razaoSocial ?? "";
      contextoRef.current.socios = analise.socios.map((socio) => socioChatVazio(socio.nome));

      await falarBot(
        contextoRef.current.razaoSocial
          ? `Seja bem-vindo(a), ${contextoRef.current.razaoSocial.toUpperCase()}! É um prazer falar com você.`
          : "Show, contrato social recebido!",
      );

      if (contextoRef.current.socios.length === 0) {
        await falarBot(
          "Não conseguimos identificar automaticamente os sócios no contrato social. Qual o nome completo do sócio principal?",
        );
        setPending({ kind: "texto", tag: "nome_socio_manual", placeholder: "Nome completo" });
        return;
      }

      await perguntarTelefoneComercial();
    } catch {
      await validarOuFalhar(
        false,
        "Não conseguimos processar esse arquivo. Pode tentar enviar de novo?",
        { kind: "arquivo", tag: "contrato_social_empresa", instrucao: "Contrato social (PDF)" },
      );
    }
  }

  async function receberNomeSocioManual(valorDigitado: string) {
    contextoRef.current.socios = [socioChatVazio(valorDigitado.trim())];
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

  // ---------- Endereço (sub-fluxo compartilhado, CEP real) ----------

  // Busca real no ViaCEP (mesmo cepAdapter/cepService do /cadastro).
  // Retorna null se o CEP não for encontrado ou a busca falhar — quem
  // chama decide o fallback de preenchimento manual.
  async function resolverEndereco(
    cepDigitado: string,
    numero: string,
  ): Promise<EnderecoResolvidoChat | null> {
    const cepLimpo = cepAdapter.toBuscaCepInput(cepDigitado);
    if (cepLimpo.length !== 8) return null;

    try {
      const raw = await cepService.buscar(cepLimpo);
      const endereco = cepAdapter.toEnderecoView(raw);
      if (!endereco) return null;

      return {
        cep: maskCep(cepLimpo),
        numero,
        logradouro: endereco.logradouro,
        complemento: "",
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf,
        resumo: `${endereco.logradouro}, ${numero} — ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`,
      };
    } catch {
      return null;
    }
  }

  function enderecoManualParaEstrutura(
    valores: Record<string, string | boolean>,
  ): EnderecoResolvidoChat {
    const cep = maskCep(String(valores.cep ?? ""));
    const numero = String(valores.numero ?? "");
    const logradouro = String(valores.logradouro ?? "");
    const bairro = String(valores.bairro ?? "");
    const cidade = String(valores.cidade ?? "");
    const uf = String(valores.uf ?? "").toUpperCase();

    return {
      cep,
      numero,
      logradouro,
      complemento: "",
      bairro,
      cidade,
      uf,
      resumo: `${logradouro}, ${numero} — ${bairro}, ${cidade}/${uf}`,
    };
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

  async function receberEnderecoSocio(valores: Record<string, string | boolean>) {
    if (valores.logradouro) {
      const indice = contextoRef.current.socioAtualIndex!;
      contextoRef.current.socios[indice]!.endereco = enderecoManualParaEstrutura(valores);
      await falarBot("Agora envie uma foto ou PDF do RG do sócio.");
      setPending({ kind: "arquivo", tag: "documento_socio", instrucao: "RG (PDF ou imagem)" });
      return;
    }

    const resolvido = await resolverEndereco(
      String(valores.cep ?? ""),
      String(valores.numero ?? ""),
    );
    if (!resolvido) {
      await falarBot(
        "Não encontramos esse CEP automaticamente. Pode preencher o endereço completo?",
      );
      setPending({
        kind: "inline-form",
        tag: "endereco_socio",
        titulo: "Endereço do sócio",
        campos: CAMPOS_ENDERECO_MANUAL,
      });
      return;
    }

    contextoRef.current.enderecoSocioPendente = resolvido;
    await falarBot(`Encontramos este endereço: ${resolvido.resumo}. Está correto?`);
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
    contextoRef.current.socios[indice]!.endereco = contextoRef.current.enderecoSocioPendente;
    await falarBot("Agora envie uma foto ou PDF do RG do sócio.");
    setPending({ kind: "arquivo", tag: "documento_socio", instrucao: "RG (PDF ou imagem)" });
  }

  async function receberDocumentoSocio(arquivo: File) {
    const erro = validarArquivoUpload(arquivo, "RG ou CNH");
    const arquivoValido = await validarOuFalhar(!erro, erro ?? "", {
      kind: "arquivo",
      tag: "documento_socio",
      instrucao: "RG (PDF ou imagem)",
    });
    if (!arquivoValido) return;

    const indice = contextoRef.current.socioAtualIndex!;
    const socio = contextoRef.current.socios[indice]!;
    socio.rgArquivo = arquivo;
    socio.documentoNome = arquivo.name;

    await falarBot("Analisando o documento...");

    try {
      const formData = agenciaAdapter.toAnalisarDocumentoIdentificacaoFormData({
        cnpjMascarado: contextoRef.current.cnpj,
        indice,
        documento: arquivo,
      });
      const raw = await agenciaService.analisarDocumentoIdentificacao(formData);
      const analise = agenciaAdapter.toDocumentoIdentificacaoAnaliseView(raw);

      // Autopreenche o que a IA extraiu — nunca perguntado diretamente,
      // mesmo padrão do /cadastro (nunca sobrescreve o que já foi
      // digitado, e nunca expõe os `alertas`).
      if (analise.dataNascimento) socio.dataNascimento = analise.dataNascimento;
      if (analise.rg) socio.rg = analise.rg;
      if (analise.rgOrgaoEmissor) socio.rgOrgaoEmissor = analise.rgOrgaoEmissor;
      if (analise.rgUf) socio.rgUf = analise.rgUf;
    } catch {
      // Best-effort — falha na análise não deve travar o cadastro; o
      // sócio segue sem esses campos extraídos (mesma regra do /cadastro).
    }

    contextoRef.current.socioAtualIndex = null;
    await irParaEscolhaSocio();
  }

  // ---------- Procurador (sócio marcado como representante legal) ----------

  async function perguntarProcurador() {
    await falarBot(
      "Existe algum procurador ou alguém que responda pela empresa fora do quadro societário?",
    );
    setPending({ kind: "quick-replies", tag: "tem_procurador", opcoes: OPCOES_SIM_NAO });
  }

  async function responderTemProcurador(valor: string) {
    contextoRef.current.temProcurador = valor === "sim";
    if (valor === "nao") {
      await perguntarEnderecoAgencia();
      return;
    }

    await falarBot("Qual sócio é o responsável que vai assinar como procurador?");
    setPending({
      kind: "quick-replies",
      tag: "escolha_socio_procurador",
      opcoes: contextoRef.current.socios.map((s, i) => ({ valor: String(i), label: s.nome })),
    });
  }

  async function escolherSocioProcurador(indice: number) {
    representanteIndiceRef.current = indice;
    contextoRef.current.socios[indice]!.isRepresentante = true;
    await falarBot("OK! Você precisa anexar uma procuração válida no campo abaixo.");
    setPending({
      kind: "arquivo",
      tag: "documento_procuracao",
      instrucao: "Procuração válida (PDF)",
    });
  }

  async function receberProcuracao(arquivo: File) {
    const erro = validarArquivoUpload(arquivo, "Procuração");
    const arquivoValido = await validarOuFalhar(!erro, erro ?? "", {
      kind: "arquivo",
      tag: "documento_procuracao",
      instrucao: "Procuração válida (PDF)",
    });
    if (!arquivoValido) return;

    const indice = representanteIndiceRef.current!;
    contextoRef.current.socios[indice]!.procuracaoArquivo = arquivo;
    contextoRef.current.socios[indice]!.procuracaoArquivoNome = arquivo.name;
    representanteIndiceRef.current = null;

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
      ctx.enderecoAgencia = ctx.socios[0]!.endereco;
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
    ctx.enderecoAgencia = ctx.socios[indice]!.endereco;
    await falarBot(`Combinado, vamos usar o mesmo endereço do sócio ${ctx.socios[indice]!.nome}.`);
    await irParaDadosBancarios();
  }

  async function receberEnderecoAgencia(valores: Record<string, string | boolean>) {
    if (valores.logradouro) {
      contextoRef.current.enderecoAgencia = enderecoManualParaEstrutura(valores);
      await irParaDadosBancarios();
      return;
    }

    const resolvido = await resolverEndereco(
      String(valores.cep ?? ""),
      String(valores.numero ?? ""),
    );
    if (!resolvido) {
      await falarBot(
        "Não encontramos esse CEP automaticamente. Pode preencher o endereço completo?",
      );
      setPending({
        kind: "inline-form",
        tag: "endereco_agencia",
        titulo: "Endereço da agência",
        campos: CAMPOS_ENDERECO_MANUAL,
      });
      return;
    }

    contextoRef.current.enderecoAgenciaPendente = resolvido;
    await falarBot(`Encontramos este endereço: ${resolvido.resumo}. Está correto?`);
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

    contextoRef.current.enderecoAgencia = contextoRef.current.enderecoAgenciaPendente;
    await irParaDadosBancarios();
  }

  async function irParaDadosBancarios() {
    if (bancosCarregandoRef.current) {
      await falarBot("Só um instante, carregando a lista de bancos...");
      while (bancosCarregandoRef.current) {
        await aguardar(150);
      }
    }

    await falarBot("Agora me conte os dados bancários da agência.");

    const campoBanco =
      bancosRef.current.length > 0
        ? {
            nome: "banco",
            label: "Banco",
            tipo: "select" as const,
            opcoes: bancosRef.current.map((b) => ({
              valor: b.codigo,
              label: `${b.codigo} - ${b.nome}`,
            })),
            obrigatorio: true,
          }
        : {
            nome: "banco",
            label: "Banco",
            tipo: "text" as const,
            placeholder: "Nome do banco",
            obrigatorio: true,
          };

    setPending({
      kind: "inline-form",
      tag: "dados_bancarios",
      titulo: "Dados bancários",
      campos: [
        campoBanco,
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
    const bancoValor = String(valores.banco ?? "");
    const bancoEncontrado = bancosRef.current.find((b) => b.codigo === bancoValor);
    const tipoContaValor = String(valores.tipoConta ?? "");
    const tipoContaLabel =
      TIPO_CONTA_OPCOES.find((o) => o.valor === tipoContaValor)?.label ?? tipoContaValor;

    contextoRef.current.banco = {
      banco: bancoEncontrado?.nome ?? bancoValor,
      codigo: bancoEncontrado?.codigo ?? "",
      agencia: String(valores.agencia ?? ""),
      conta: String(valores.conta ?? ""),
      tipoConta: tipoContaValor,
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
      ...ctx.socios.map(
        (s) => `Sócio: ${s.nome} — CPF ${s.cpf}${s.isRepresentante ? " (procurador)" : ""}`,
      ),
      `Endereço da agência: ${ctx.enderecoAgencia?.resumo ?? "—"}`,
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
    void executarEnvioReal();
  }

  async function aguardarRestanteAnalise(inicio: number) {
    const decorrido = Date.now() - inicio;
    const restante = Math.max(0, DURACAO_MINIMA_ANALISE_MS - decorrido);
    if (restante > 0) await aguardar(restante);
  }

  function voltarParaRevisaoComErro(mensagem: string) {
    setFase("chat");
    void (async () => {
      await falarBot(mensagem);
      setPending({
        kind: "quick-replies",
        tag: "confirmar_envio",
        opcoes: [{ valor: "enviar", label: "Enviar cadastro" }],
      });
    })();
  }

  // Envio real: monta o mesmo FormData que o /cadastro monta
  // (agenciaAdapter.toFinalizarCadastroFormData) a partir do que foi
  // coletado na conversa, chama agenciaService.criarAgencia de verdade
  // e só decide o desfecho com base na resposta real do backend.
  async function executarEnvioReal() {
    const ctx = contextoRef.current;
    const inicio = Date.now();

    const socios: SocioWizardFormValues[] = ctx.socios.map((s) => ({
      nome: s.nome,
      telefone: s.telefone?.numero ?? "",
      telefonePais: "BR",
      email: s.email,
      cpf: s.cpf,
      dataNascimento: s.dataNascimento ?? "",
      estadoCivil: s.estadoCivil,
      cep: s.endereco?.cep ?? "",
      logradouro: s.endereco?.logradouro ?? "",
      numero: s.endereco?.numero ?? "",
      bairro: s.endereco?.bairro ?? "",
      cidade: s.endereco?.cidade ?? "",
      uf: s.endereco?.uf ?? "",
      rg: s.rg ?? "",
      rgOrgaoEmissor: s.rgOrgaoEmissor ?? "",
      rgUf: s.rgUf ?? "",
      rgArquivo: s.rgArquivo,
      isRepresentante: s.isRepresentante,
      procuracaoArquivo: s.procuracaoArquivo,
    }));

    const enderecoBanco: EnderecoBancoFormValues = {
      enderecoMesmoSocio: false,
      socioEnderecoVinculado: null,
      cep: ctx.enderecoAgencia?.cep ?? "",
      logradouro: ctx.enderecoAgencia?.logradouro ?? "",
      numero: ctx.enderecoAgencia?.numero ?? "",
      complemento: ctx.enderecoAgencia?.complemento ?? "",
      bairro: ctx.enderecoAgencia?.bairro ?? "",
      cidade: ctx.enderecoAgencia?.cidade ?? "",
      uf: ctx.enderecoAgencia?.uf ?? "",
      bancoPais: "nacional",
      bancoNome: ctx.banco?.banco ?? "",
      bancoCodigo: ctx.banco?.codigo ?? "",
      bancoAgencia: ctx.banco?.agencia ?? "",
      bancoConta: ctx.banco?.conta ?? "",
      bancoSwift: "",
      tipoConta: ctx.banco?.tipoConta ?? "",
      favorecidoEhEmpresa: ctx.banco?.favorecidoEhEmpresa ?? false,
      favorecidoNome: ctx.banco?.favorecidoEhEmpresa ? ctx.razaoSocial : "",
      favorecidoDoc: ctx.banco?.favorecidoEhEmpresa ? ctx.cnpj : "",
    };

    try {
      const formData = agenciaAdapter.toFinalizarCadastroFormData({
        cnpjMascarado: ctx.cnpj,
        razaoSocial: ctx.razaoSocial,
        contratoSocial: ctx.contratoSocial!,
        origem: "Chat",
        telefoneComercial: ctx.telefoneComercial?.numero ?? "",
        telefoneComercialPais: "BR",
        semTelefoneComercial: !ctx.telefoneComercial,
        emailOperacional: ctx.emailContato,
        emailComercial: ctx.emailComercial ?? ctx.emailContato,
        emailFinanceiro: ctx.emailFinanceiro ?? ctx.emailContato,
        socios,
        enderecoBanco,
      });

      const raw = await agenciaService.criarAgencia(formData);
      const resultado = agenciaAdapter.toSubmitResultView(raw);

      await aguardarRestanteAnalise(inicio);

      if (resultado.success) {
        setResultadoFinal(
          resultado.precisaRevisaoManual
            ? {
                tipo: "manual",
                titulo: "Seu cadastro foi encaminhado a um de nossos analistas.",
                mensagem:
                  "Fique ligado! Em breve alguém da nossa equipe entrará em contato para mais detalhes.",
              }
            : {
                tipo: "aprovado",
                titulo: "Seu cadastro foi aprovado!",
                mensagem:
                  "O link com o contrato da agência foi enviado no e-mail dos sócios cadastrados.",
              },
        );
        setFase("resultado");
        // Cadastro já persistido de verdade no banco — limpa tudo da
        // conversa em memória, mesma regra aplicada no /cadastro.
        contextoRef.current = contextoVazio();
        setMessages([]);
        setPending(null);
        return;
      }

      if (resultado.duplicado) {
        setResultadoFinal({
          tipo: "duplicado",
          titulo: "Já Cadastrada",
          mensagem: "Este CNPJ já possui um cadastro em andamento.",
        });
        setFase("resultado");
        contextoRef.current = contextoVazio();
        setMessages([]);
        setPending(null);
        return;
      }

      voltarParaRevisaoComErro(
        resultado.error ?? "Não foi possível enviar o cadastro. Pode tentar novamente?",
      );
    } catch {
      await aguardarRestanteAnalise(inicio);
      voltarParaRevisaoComErro("Falha de conexão. Verifique sua internet e tente novamente.");
    }
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
    else if (tag === "nome_socio_manual") await receberNomeSocioManual(valor);
    else if (tag === "email_contato") await receberEmailContato(valor);
    else if (tag === "email_comercial") await receberEmailComercial(valor);
    else if (tag === "email_financeiro") await receberEmailFinanceiro(valor);
    else if (tag === "telefone_celular") await receberTelefoneNumero(valor, "celular");
    else if (tag === "telefone_fixo") await receberTelefoneNumero(valor, "fixo");
    else if (tag === "cpf") await receberCpf(valor);
    else if (tag === "email") await receberEmail(valor);
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
    else if (tag === "escolha_socio_procurador") await escolherSocioProcurador(Number(valor));
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
    else if (tag === "endereco_agencia") await receberEnderecoAgencia(valores);
    else if (tag === "dados_bancarios") await receberDadosBancarios(valores);
  }

  async function onEnviarArquivo(arquivo: File) {
    if (!pending || pending.kind !== "arquivo") return;
    const tag = pending.tag;
    pushUserArquivo(arquivo.name);
    setPending(null);

    if (tag === "contrato_social_empresa") await receberContratoSocialEmpresa(arquivo);
    else if (tag === "documento_socio") await receberDocumentoSocio(arquivo);
    else if (tag === "documento_procuracao") await receberProcuracao(arquivo);
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
  };
}
