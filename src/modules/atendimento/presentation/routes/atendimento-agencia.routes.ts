import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import {
  ConflictError,
  DomainError,
  NotFoundError,
  RateLimitError,
} from "@/modules/shared/domain/errors";
import { verificarRateLimit } from "@/modules/shared/infrastructure/rate-limiter";
import { atendimentoController } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { solicitarTransferenciaAtendimentoAgenciaSchema } from "@/modules/atendimento/application/dto/solicitar-transferencia-atendimento-agencia.schema";
import { papelNaSolicitacao } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";
import type { SolicitacaoAtendimentoAgenciaEntity } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";

// Mesmo formato em toda resposta HTTP e no payload do SSE — o front nunca
// recalcula "quem sou eu nessa solicitação" sozinho (ver
// solicitacao-atendimento-agencia.entity.ts).
function paraView(entity: SolicitacaoAtendimentoAgenciaEntity, meuId: string) {
  return { ...entity, meuPapel: papelNaSolicitacao(entity, meuId) };
}

// Rotas do atendimento do CADASTRO da agência (SolicitacaoAtendimentoAgencia)
// — arquivo dedicado, separado de atendimento.routes.ts (que é do chat/
// Conversa, fluxo intocado por esta feature).
const RATE_LIMIT_ESCRITA = { limite: 60, janelaMs: 60 * 1000 };

function mapErrorToResponse(error: unknown) {
  if (error instanceof RateLimitError) return httpError(error.message, 429);
  if (error instanceof NotFoundError) return httpError(error.message, 404);
  if (error instanceof ConflictError) return httpError(error.message, 409);
  if (error instanceof DomainError) return httpError(error.message, 400);
  return httpError("Erro interno do servidor.", 500);
}

async function requireSessionUserId(): Promise<string | null> {
  const session = await getServerSession(nextAuthOptions);
  return session?.user?.id ?? null;
}

// "Iniciar atendimento" — só funciona quando ninguém está atendendo (ver
// AssumirAtendimentoAgenciaUseCase). Usado por AtendimentoAgenciaAcoes em
// qualquer tela (dossiê, listagem, chat) — único caminho de escrita agora,
// sem Server Action separada.
export async function iniciarAtendimentoAgenciaRoute(_request: Request, agenciaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-agencia-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    await atendimentoController.assumirAtendimentoAgencia(agenciaId, analistaId);
    const atual = await atendimentoController.obterAtendimentoAgenciaAtual(agenciaId);
    return httpOk(atual);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function encerrarAtendimentoAgenciaRoute(_request: Request, agenciaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-agencia-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    await atendimentoController.encerrarAtendimentoAgencia(agenciaId, analistaId);
    const atual = await atendimentoController.obterAtendimentoAgenciaAtual(agenciaId);
    return httpOk(atual);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function solicitarTransferenciaAgenciaRoute(request: Request, agenciaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-agencia-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const body = await request.json();
    const parsed = solicitarTransferenciaAtendimentoAgenciaSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const solicitacao = await atendimentoController.solicitarTransferenciaAtendimentoAgencia({
      agenciaId,
      deAnalistaId: analistaId,
      paraAnalistaId: parsed.data.paraAnalistaId,
    });
    return httpOk(paraView(solicitacao, analistaId));
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function solicitarAssuncaoAgenciaRoute(_request: Request, agenciaId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-agencia-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const solicitacao = await atendimentoController.solicitarAssuncaoAtendimentoAgencia({
      agenciaId,
      solicitanteId: analistaId,
    });
    return httpOk(paraView(solicitacao, analistaId));
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function confirmarSolicitacaoAgenciaRoute(_request: Request, solicitacaoId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-agencia-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const solicitacao = await atendimentoController.confirmarSolicitacaoAtendimentoAgencia({
      solicitacaoId,
      analistaId,
    });
    return httpOk(paraView(solicitacao, analistaId));
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function cancelarSolicitacaoAgenciaRoute(_request: Request, solicitacaoId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const chaveRateLimit = `atendimento-agencia-escrita:${analistaId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ESCRITA)) throw new RateLimitError();

    const solicitacao = await atendimentoController.cancelarSolicitacaoAtendimentoAgencia({
      solicitacaoId,
      analistaId,
    });
    return httpOk(paraView(solicitacao, analistaId));
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

// Hidratação inicial do toast global + safety-net de polling (60s) — todas
// as solicitações pendentes envolvendo o analista logado, em qualquer
// agência.
export async function listarSolicitacoesAgenciaPendentesRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const pendentes =
      await atendimentoController.listarSolicitacoesAtendimentoAgenciaPendentes(analistaId);
    return httpOk(pendentes.map((solicitacao) => paraView(solicitacao, analistaId)));
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
