import { NextResponse } from "next/server";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { DomainError, NotFoundError, ConflictError } from "@/modules/shared/domain/errors";
import { obterSessaoUsuario } from "@/modules/auth/presentation/utils/sessao.util";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import { createBaseSchema } from "@/modules/bases/application/dto/create-base.schema";
import { updateBaseSchema } from "@/modules/bases/application/dto/update-base.schema";

// Gerenciar Base é privilégio de Admin/Diretor, mesmo guard de
// gestores.routes.ts — leitura (GET) fica liberada pra qualquer autenticado,
// já que Gestor/Executivo precisam listar bases pra escolher no próprio form
// (só não podem criar/editar a base em si).
const CARGOS_GESTAO_DE_BASES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

async function exigirAcessoGestaoDeBases() {
  const sessao = await obterSessaoUsuario();
  if (!sessao || !CARGOS_GESTAO_DE_BASES.has(sessao.cargo)) {
    return httpError("Acesso não permitido.", 403);
  }
  return null;
}

function mapErrorToResponse(error: unknown) {
  if (error instanceof NotFoundError) {
    return httpError(error.message, 404);
  }
  if (error instanceof ConflictError) {
    return httpError(error.message, 409);
  }
  if (error instanceof DomainError) {
    return httpError(error.message, 400);
  }
  return httpError("Erro interno do servidor.", 500);
}

export async function listBasesRoute() {
  const sessao = await obterSessaoUsuario();
  if (!sessao) return httpError("Não autenticado.", 401);

  try {
    const bases = await basesController.list();
    return httpOk(bases);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function createBaseRoute(request: Request) {
  const negado = await exigirAcessoGestaoDeBases();
  if (negado) return negado;

  try {
    const body = await request.json();
    const parsed = createBaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const base = await basesController.create(parsed.data);
    return httpCreated(base);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function getBaseByIdRoute(id: string) {
  const sessao = await obterSessaoUsuario();
  if (!sessao) return httpError("Não autenticado.", 401);

  try {
    const base = await basesController.getById(id);
    return httpOk(base);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function updateBaseRoute(request: Request, id: string) {
  const negado = await exigirAcessoGestaoDeBases();
  if (negado) return negado;

  try {
    const body = await request.json();
    const parsed = updateBaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const base = await basesController.update(id, parsed.data);
    return httpOk(base);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
