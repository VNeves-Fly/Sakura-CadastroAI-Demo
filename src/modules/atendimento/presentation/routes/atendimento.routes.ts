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
// Cross-módulo de propósito: "vincular mídia do chat como documento do
// cadastro" é uma operação do domínio de cadastro (cria Documento), só
// que iniciada a partir do chat — expor sob /api/atendimento/* é só
// questão de descoberta pro front, a lógica mora inteira em cadastro.
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { enviarMensagemSchema } from "@/modules/atendimento/application/dto/enviar-mensagem.schema";
import { criarTextoProntoSchema } from "@/modules/atendimento/application/dto/criar-texto-pronto.schema";
import { atualizarTextoProntoSchema } from "@/modules/atendimento/application/dto/atualizar-texto-pronto.schema";
import { criarTemplateSchema } from "@/modules/atendimento/application/dto/criar-template.schema";
import { reenviarTemplateSchema } from "@/modules/atendimento/application/dto/reenviar-template.schema";
import { atualizarTemplateMetadataSchema } from "@/modules/atendimento/application/dto/atualizar-template-metadata.schema";
import { iniciarConversaSchema } from "@/modules/atendimento/application/dto/iniciar-conversa.schema";

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

export async function atualizarTemplateMetadataRoute(request: Request, id: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const body = await request.json();
    const parsed = atualizarTemplateMetadataSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const template = await atendimentoController.atualizarTemplateMetadata(id, parsed.data);
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

// Lista os slots de documento reprovados (contrato social + RG/procuração
// por sócio) — mesmo formato já usado na página pública de reenvio,
// reaproveitado aqui pro picker de "vincular mídia do chat".
export async function listarDocumentosPendentesAgenciaRoute(_request: Request, agenciaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const pendentes = await cadastroAdminController.listarDocumentosPendentes(agenciaId);
    return httpOk(pendentes);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function vincularMidiaComoDocumentoRoute(request: Request, midiaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const body = await request.json();
    const agenciaId = typeof body?.agenciaId === "string" ? body.agenciaId : null;
    const documentoId = typeof body?.documentoId === "string" ? body.documentoId : null;

    if (!agenciaId || !documentoId) {
      return httpError("Informe agenciaId e documentoId.", 422);
    }

    const documento = await cadastroAdminController.vincularMidiaComoDocumento({
      agenciaId,
      documentoId,
      midiaId,
    });
    return httpOk(documento);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

// Aba "Contatos" — todas as agências (não só as com conversa já
// materializada), com busca por nome ou CNPJ via `?busca=`.
export async function listarContatosRoute(request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const busca = new URL(request.url).searchParams.get("busca") ?? undefined;
    const contatos = await atendimentoController.listarContatos({ busca });
    return httpOk(contatos);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

// Modal "com quem você quer falar" ao chegar de /atendimento?agenciaId=X.
export async function obterContatoAgenciaRoute(_request: Request, agenciaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const contato = await atendimentoController.obterContatoAgencia({ agenciaId });
    return httpOk(contato);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function iniciarConversaRoute(request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const body = await request.json();
    const parsed = iniciarConversaSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const conversa = await atendimentoController.iniciarConversa({ ...parsed.data, analistaId });
    return httpCreated(conversa);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
