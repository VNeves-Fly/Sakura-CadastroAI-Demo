import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import {
  ConflictError,
  DomainError,
  NotFoundError,
  RateLimitError,
} from "@/modules/shared/domain/errors";
import { verificarRateLimit } from "@/modules/shared/infrastructure/rate-limiter";
import { ForaDaJanela24hError } from "@/modules/atendimento/domain/errors";
import { atendimentoController } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { enviarMensagemSchema } from "@/modules/atendimento/application/dto/enviar-mensagem.schema";
import { criarTextoProntoSchema } from "@/modules/atendimento/application/dto/criar-texto-pronto.schema";
import { atualizarTextoProntoSchema } from "@/modules/atendimento/application/dto/atualizar-texto-pronto.schema";
import { solicitarTransferenciaSchema } from "@/modules/atendimento/application/dto/solicitar-transferencia.schema";
import { responderTransferenciaSchema } from "@/modules/atendimento/application/dto/responder-transferencia.schema";
import { criarTemplateSchema } from "@/modules/atendimento/application/dto/criar-template.schema";
import { reenviarTemplateSchema } from "@/modules/atendimento/application/dto/reenviar-template.schema";

// Ações de analista autenticado — não expostas ao público, mas ainda
// protegidas contra clique acidental em loop (ex.: double submit).
const RATE_LIMIT_ESCRITA = { limite: 60, janelaMs: 60 * 1000 };

function mapErrorToResponse(error: unknown) {
  if (error instanceof RateLimitError) return httpError(error.message, 429);
  if (error instanceof NotFoundError) return httpError(error.message, 404);
  if (error instanceof ForaDaJanela24hError) return httpError(error.message, 409);
  if (error instanceof ConflictError) return httpError(error.message, 409);
  if (error instanceof DomainError) return httpError(error.message, 400);
  return httpError("Erro interno do servidor.", 500);
}

async function requireSessionUserId(): Promise<string | null> {
  const session = await getServerSession(nextAuthOptions);
  return session?.user?.id ?? null;
}

export async function listarConversasRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const conversas = await atendimentoController.listarConversas();
    return httpOk(conversas);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function listarTemplatesAprovadosRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const templates = await atendimentoController.listarTemplatesAprovados();
    return httpOk(templates);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function sincronizarTemplatesRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const total = await atendimentoController.sincronizarTemplates();
    return httpOk({ sincronizados: total });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function listarTextosProntosRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const textos = await atendimentoController.listarTextosProntos();
    return httpOk(textos);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function criarTextoProntoRoute(request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const body = await request.json();
    const parsed = criarTextoProntoSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const texto = await atendimentoController.criarTextoPronto({
      ...parsed.data,
      criadoPorId: analistaId,
    });
    return httpCreated(texto);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function marcarComoLidaRoute(_request: Request, conversaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const conversa = await atendimentoController.marcarComoLida(conversaId);
    return httpOk(conversa);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function enviarMensagemRoute(request: Request, conversaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const body = await request.json();
    const parsed = enviarMensagemSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    // `analistaNome` que o front ainda manda no body (compatibilidade de
    // wire shape) é ignorado aqui de propósito — a identidade de quem
    // envia vem sempre da sessão, nunca de um campo digitável pelo cliente.
    const mensagem = await atendimentoController.enviarMensagem({
      conversaId,
      analistaId,
      ...parsed.data,
    });
    return httpCreated(mensagem);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function obterArquivoMidiaRoute(_request: Request, midiaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const { resultado, fileName } = await atendimentoController.obterArquivoMidia(midiaId);

    if (resultado.tipo === "redirect") {
      return Response.redirect(resultado.url);
    }

    return new Response(new Uint8Array(resultado.buffer), {
      headers: {
        "Content-Type": resultado.mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function assumirAtendimentoRoute(_request: Request, conversaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const conversa = await atendimentoController.assumirAtendimento({ conversaId, analistaId });
    return httpOk(conversa);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function encerrarAtendimentoRoute(_request: Request, conversaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const conversa = await atendimentoController.encerrarAtendimento({ conversaId, analistaId });
    return httpOk(conversa);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function solicitarTransferenciaRoute(request: Request, conversaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const body = await request.json();
    const parsed = solicitarTransferenciaSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    // `deAnalista` que o front manda no body é ignorado — quem pede a
    // transferência é sempre o analista da sessão. `paraAnalista` é o id
    // do analista de destino (escolhido pelo SeletorTransferencia).
    const conversa = await atendimentoController.solicitarTransferencia({
      conversaId,
      deAnalistaId: analistaId,
      paraAnalistaId: parsed.data.paraAnalista,
    });
    return httpOk(conversa);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function responderTransferenciaRoute(request: Request, conversaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const body = await request.json();
    const parsed = responderTransferenciaSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const conversa = await atendimentoController.responderTransferencia({
      conversaId,
      analistaId,
      aceita: parsed.data.aceita,
    });
    return httpOk(conversa);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function limparSolicitacaoTransferenciaRoute(_request: Request, conversaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const conversa = await atendimentoController.limparSolicitacaoTransferencia(conversaId);
    return httpOk(conversa);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function atualizarTextoProntoRoute(request: Request, id: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const body = await request.json();
    const parsed = atualizarTextoProntoSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const texto = await atendimentoController.atualizarTextoPronto(id, parsed.data);
    return httpOk(texto);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function removerTextoProntoRoute(_request: Request, id: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    await atendimentoController.removerTextoPronto(id);
    return httpOk({ removido: true });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function listarTodosTemplatesRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const templates = await atendimentoController.listarTodosTemplates();
    return httpOk(templates);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function criarTemplateRoute(request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const body = await request.json();
    const parsed = criarTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const template = await atendimentoController.criarTemplate(parsed.data);
    return httpCreated(template);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function reenviarTemplateRoute(request: Request, id: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const body = await request.json();
    const parsed = reenviarTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const template = await atendimentoController.reenviarTemplate(id, parsed.data.novoConteudo);
    return httpOk(template);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function obterConfiguracaoWhatsappRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const configuracao = atendimentoController.obterConfiguracaoWhatsapp();
    return httpOk(configuracao);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function testarConexaoWhatsappRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const resultado = await atendimentoController.testarConexaoWhatsapp();
    return httpOk(resultado);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
