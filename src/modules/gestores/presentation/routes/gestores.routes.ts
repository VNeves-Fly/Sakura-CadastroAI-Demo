import { NextResponse } from "next/server";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { DomainError, NotFoundError, ConflictError } from "@/modules/shared/domain/errors";
import { obterSessaoUsuario } from "@/modules/auth/presentation/utils/sessao.util";
import { gestoresController } from "@/modules/gestores/presentation/controllers/gestores.controller";
import { createGestorSchema } from "@/modules/gestores/application/dto/create-gestor.schema";
import { updateGestorSchema } from "@/modules/gestores/application/dto/update-gestor.schema";

// Cadastrar/editar Gestor é privilégio de Admin/Diretor (decisão do
// usuário, 2026-08-03) — checado aqui além de escondido na sidebar/página,
// já que a API é chamável direto sem passar pela UI.
const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

async function exigirAcessoGestaoDeGestores() {
  const sessao = await obterSessaoUsuario();
  if (!sessao || !CARGOS_GESTAO_DE_GESTORES.has(sessao.cargo)) {
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

export async function listGestoresRoute() {
  const negado = await exigirAcessoGestaoDeGestores();
  if (negado) return negado;

  try {
    const gestores = await gestoresController.list();
    return httpOk(gestores);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function createGestorRoute(request: Request) {
  const negado = await exigirAcessoGestaoDeGestores();
  if (negado) return negado;

  try {
    const body = await request.json();
    const parsed = createGestorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const gestor = await gestoresController.create(parsed.data);
    return httpCreated(gestor);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function getGestorByIdRoute(id: string) {
  const negado = await exigirAcessoGestaoDeGestores();
  if (negado) return negado;

  try {
    const gestor = await gestoresController.getById(id);
    return httpOk(gestor);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function updateGestorRoute(request: Request, id: string) {
  const negado = await exigirAcessoGestaoDeGestores();
  if (negado) return negado;

  try {
    const body = await request.json();
    const parsed = updateGestorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const gestor = await gestoresController.update(id, parsed.data);
    return httpOk(gestor);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
