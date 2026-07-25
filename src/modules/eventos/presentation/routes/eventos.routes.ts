import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import { eventosAdminController } from "@/modules/eventos/presentation/controllers/eventos-admin.controller";
import {
  criarEventoSchema,
  criarEventoLinkSchema,
} from "@/modules/eventos/application/dto/criar-evento-link.schema";

function mapErrorToResponse(error: unknown) {
  if (error instanceof NotFoundError) return httpError(error.message, 404);
  if (error instanceof ConflictError) return httpError(error.message, 409);
  if (error instanceof DomainError) return httpError(error.message, 400);
  return httpError("Erro interno do servidor.", 500);
}

async function requireSessionUserId(): Promise<string | null> {
  const session = await getServerSession(nextAuthOptions);
  return session?.user?.id ?? null;
}

export async function listarEventosRoute(_request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const eventos = await eventosAdminController.listarEventos();
    return httpOk(eventos);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function criarEventoRoute(request: Request) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const body = await request.json();
    const parsed = criarEventoSchema.safeParse(body);
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const evento = await eventosAdminController.criarEvento(parsed.data.nome);
    return httpCreated(evento);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function criarEventoLinkRoute(request: Request, eventoId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const body = await request.json();
    const parsed = criarEventoLinkSchema.safeParse({ ...body, eventoId });
    if (!parsed.success) {
      return httpError(parsed.error.issues.map((issue) => issue.message).join(" "), 422);
    }

    const link = await eventosAdminController.criarEventoLink(parsed.data);
    return httpCreated(link);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function alternarAtivoLinkRoute(_request: Request, linkId: string) {
  const analistaId = await requireSessionUserId();
  if (!analistaId) return httpError("Não autenticado.", 401);

  try {
    const link = await eventosAdminController.alternarAtivoLink(linkId);
    return httpOk(link);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
