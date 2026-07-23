import type {
  Conversa,
  Mensagem,
  TextoPronto,
  TemplateAprovado,
} from "@/modules/atendimento/types/atendimento.types";

// Dado 100% mockado, gerado uma vez por carregamento da página — nada
// aqui vem do banco (ver nota em atendimento.types.ts). Datas já saem
// como ISO string, igual uma API real devolveria.

function minutosAtras(minutos: number): string {
  return new Date(Date.now() - minutos * 60 * 1000).toISOString();
}

function horasAtras(horas: number): string {
  return minutosAtras(horas * 60);
}

function mensagem(parcial: Omit<Mensagem, "id">): Mensagem {
  return { id: crypto.randomUUID(), ...parcial };
}

export function gerarConversasMock(): Conversa[] {
  const conversa1Mensagens: Mensagem[] = [
    mensagem({
      conversaId: "conversa-1",
      autor: "cliente",
      tipo: "texto",
      conteudo: "Oi, bom dia! Reenviei o contrato social ontem, vocês já conferiram?",
      createdAt: minutosAtras(50),
      lido: true,
    }),
    mensagem({
      conversaId: "conversa-1",
      autor: "analista",
      analistaNome: "Fernanda Lima",
      tipo: "texto",
      conteudo: "Bom dia, Camila! Vou conferir agora e já te retorno.",
      createdAt: minutosAtras(48),
      lido: true,
    }),
    mensagem({
      conversaId: "conversa-1",
      autor: "cliente",
      tipo: "pdf",
      conteudo: "contrato-social-atualizado.pdf",
      tamanhoArquivo: "1.8 MB",
      createdAt: minutosAtras(20),
      lido: false,
    }),
    mensagem({
      conversaId: "conversa-1",
      autor: "cliente",
      tipo: "audio",
      conteudo: "audio-camila.ogg",
      duracaoSegundos: 14,
      createdAt: minutosAtras(19),
      lido: false,
    }),
    mensagem({
      conversaId: "conversa-1",
      autor: "cliente",
      tipo: "texto",
      conteudo: "Fico no aguardo, obrigada!",
      createdAt: minutosAtras(18),
      lido: false,
    }),
  ];

  const conversa2Mensagens: Mensagem[] = [
    mensagem({
      conversaId: "conversa-2",
      autor: "cliente",
      tipo: "texto",
      conteudo: "Vocês emitem nota fiscal direto ou é por fora?",
      createdAt: horasAtras(6),
      lido: true,
    }),
    mensagem({
      conversaId: "conversa-2",
      autor: "analista",
      analistaNome: "Fernanda Lima",
      tipo: "texto",
      conteudo: "Emitimos direto, assim que o cadastro for aprovado te explico o passo a passo.",
      createdAt: horasAtras(6),
      lido: true,
    }),
  ];

  const conversa3Mensagens: Mensagem[] = [
    mensagem({
      conversaId: "conversa-3",
      autor: "cliente",
      tipo: "imagem",
      conteudo: "print-erro-login.png",
      createdAt: minutosAtras(35),
      lido: true,
    }),
    mensagem({
      conversaId: "conversa-3",
      autor: "cliente",
      tipo: "texto",
      conteudo: "Esse erro aparece quando tento entrar no painel de reservas.",
      createdAt: minutosAtras(34),
      lido: true,
    }),
    mensagem({
      conversaId: "conversa-3",
      autor: "analista",
      analistaNome: "Fernanda Lima",
      tipo: "texto",
      conteudo: "Rodrigo, deixa eu verificar com o time técnico e já te retorno.",
      createdAt: minutosAtras(28),
      lido: true,
    }),
  ];

  const conversa4Mensagens: Mensagem[] = [
    mensagem({
      conversaId: "conversa-4",
      autor: "cliente",
      tipo: "texto",
      conteudo: "Boa tarde, gostaria de entender por que nosso cadastro foi recusado.",
      createdAt: horasAtras(3),
      lido: true,
    }),
    mensagem({
      conversaId: "conversa-4",
      autor: "analista",
      analistaNome: "Pedro Santos",
      tipo: "texto",
      conteudo:
        "Boa tarde, Beatriz! Foi por conta de uma pendência financeira identificada — vou te enviar os detalhes.",
      createdAt: horasAtras(3),
      lido: true,
    }),
  ];

  const conversa5Mensagens: Mensagem[] = [
    mensagem({
      conversaId: "conversa-5",
      autor: "cliente",
      tipo: "texto",
      conteudo: "Alguma novidade sobre o nosso cadastro?",
      createdAt: horasAtras(30),
      lido: false,
    }),
  ];

  return [
    {
      id: "conversa-1",
      agenciaId: "agencia-horizonte",
      agenciaNome: "Agência Horizonte Turismo Ltda",
      agenciaCnpj: "12345678000190",
      membro: {
        id: "membro-camila",
        nome: "Camila Rocha",
        papel: "socio",
        telefone: "+55 11 98888-1234",
      },
      atendimentoAtual: null,
      historicoAtendimento: [
        { analistaNome: "Fernanda Lima", assumidoEm: horasAtras(30), liberadoEm: horasAtras(29) },
      ],
      resumoFicha: {
        statusAgencia: "em_andamento",
        documentosAprovados: 2,
        documentosPendentes: 1,
        situacaoCadastralReceita: "ATIVA",
        contratoStatus: "Aguardando assinaturas",
        amatSofiaConsultado: true,
      },
      mensagens: conversa1Mensagens,
      createdAt: horasAtras(48),
      updatedAt: minutosAtras(18),
      lastMessageAt: minutosAtras(18),
    },
    {
      id: "conversa-2",
      agenciaId: "agencia-horizonte",
      agenciaNome: "Agência Horizonte Turismo Ltda",
      agenciaCnpj: "12345678000190",
      membro: {
        id: "membro-horizonte-comercial",
        nome: "Comercial — Horizonte Turismo",
        papel: "comercial",
        telefone: "+55 11 3333-4455",
      },
      atendimentoAtual: null,
      historicoAtendimento: [],
      resumoFicha: {
        statusAgencia: "em_andamento",
        documentosAprovados: 2,
        documentosPendentes: 1,
        situacaoCadastralReceita: "ATIVA",
        contratoStatus: "Aguardando assinaturas",
        amatSofiaConsultado: true,
      },
      mensagens: conversa2Mensagens,
      createdAt: horasAtras(48),
      updatedAt: horasAtras(6),
      lastMessageAt: horasAtras(6),
    },
    {
      id: "conversa-3",
      agenciaId: "agencia-vale-encantado",
      agenciaNome: "Agência Vale Encantado Turismo Ltda",
      agenciaCnpj: "98765432000155",
      membro: {
        id: "membro-rodrigo",
        nome: "Rodrigo Almeida",
        papel: "representante_legal",
        telefone: "+55 21 97777-5566",
      },
      atendimentoAtual: {
        analistaNome: "Fernanda Lima",
        assumidoEm: minutosAtras(30),
        liberadoEm: null,
      },
      historicoAtendimento: [
        { analistaNome: "Pedro Santos", assumidoEm: horasAtras(26), liberadoEm: horasAtras(25) },
        { analistaNome: "Fernanda Lima", assumidoEm: minutosAtras(30), liberadoEm: null },
      ],
      resumoFicha: {
        statusAgencia: "ativo",
        documentosAprovados: 3,
        documentosPendentes: 0,
        situacaoCadastralReceita: "ATIVA",
        contratoStatus: "Assinado",
        amatSofiaConsultado: true,
      },
      mensagens: conversa3Mensagens,
      createdAt: horasAtras(70),
      updatedAt: minutosAtras(28),
      lastMessageAt: minutosAtras(28),
    },
    {
      id: "conversa-4",
      agenciaId: "agencia-costa-azul",
      agenciaNome: "Agência Costa Azul Passagens Ltda",
      agenciaCnpj: "45612378000199",
      membro: {
        id: "membro-beatriz",
        nome: "Beatriz Nunes",
        papel: "socio",
        telefone: "+55 31 96666-7788",
      },
      atendimentoAtual: {
        analistaNome: "Pedro Santos",
        assumidoEm: horasAtras(3),
        liberadoEm: null,
      },
      historicoAtendimento: [
        { analistaNome: "Pedro Santos", assumidoEm: horasAtras(3), liberadoEm: null },
      ],
      resumoFicha: {
        statusAgencia: "recusado",
        documentosAprovados: 1,
        documentosPendentes: 2,
        situacaoCadastralReceita: "ATIVA",
        contratoStatus: null,
        amatSofiaConsultado: false,
      },
      mensagens: conversa4Mensagens,
      createdAt: horasAtras(96),
      updatedAt: horasAtras(3),
      lastMessageAt: horasAtras(3),
    },
    {
      id: "conversa-5",
      agenciaId: "agencia-costa-azul",
      agenciaNome: "Agência Costa Azul Passagens Ltda",
      agenciaCnpj: "45612378000199",
      membro: {
        id: "membro-costa-azul-comercial",
        nome: "Comercial — Costa Azul",
        papel: "comercial",
        telefone: "+55 31 3222-1100",
      },
      atendimentoAtual: null,
      historicoAtendimento: [],
      resumoFicha: {
        statusAgencia: "recusado",
        documentosAprovados: 1,
        documentosPendentes: 2,
        situacaoCadastralReceita: "ATIVA",
        contratoStatus: null,
        amatSofiaConsultado: false,
      },
      mensagens: conversa5Mensagens,
      createdAt: horasAtras(96),
      updatedAt: horasAtras(30),
      lastMessageAt: horasAtras(30),
    },
  ];
}

export function gerarTextosProntosMock(): TextoPronto[] {
  return [
    {
      id: "texto-1",
      titulo: "Saudação inicial",
      conteudo: "Olá! Sou analista da Sakura, em que posso te ajudar hoje?",
    },
    {
      id: "texto-2",
      titulo: "Aguardando documento",
      conteudo:
        "Ainda estamos aguardando o reenvio do documento pendente — assim que chegar, seguimos com a análise.",
    },
    {
      id: "texto-3",
      titulo: "Cadastro aprovado",
      conteudo:
        "Boas notícias! Seu cadastro foi aprovado e o contrato já foi enviado pra assinatura.",
    },
  ];
}

export function gerarTemplatesAprovadosMock(): TemplateAprovado[] {
  return [
    {
      id: "template-1",
      nome: "boas_vindas_retorno",
      conteudo:
        "Olá! Notamos que faz um tempo desde nossa última conversa. Podemos ajudar em algo?",
    },
    {
      id: "template-2",
      nome: "status_cadastro",
      conteudo: "Olá! Passando pra te atualizar sobre o status do seu cadastro na Sakura.",
    },
  ];
}
