import { NextResponse } from "next/server";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { DomainError, NotFoundError, ConflictError } from "@/modules/shared/domain/errors";
import { obterSessaoUsuario } from "@/modules/auth/presentation/utils/sessao.util";
import { associacoesController } from "@/modules/associacoes/presentation/controllers/associacoes.controller";
import { createAssociacaoSchema } from "@/modules/associacoes/application/dto/create-associacao.schema";
import { updateAssociacaoSchema } from "@/modules/associacoes/application/dto/update-associacao.schema";

// Mesmo guard de bases.routes.ts/gestores.routes.ts — Admin/Diretor
// gerenciam, leitura liberada pra qualquer autenticado.
const CARGOS_GESTAO_DE_ASSOCIACOES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

async function exigirAcessoGestaoDeAssociacoes() {
  const sessao = await obterSessaoUsuario();
  if (!sessao || !CARGOS_GESTAO_DE_ASSOCIACOES.has(sessao.cargo)) {
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

export async function listAssociacoesRoute() {
  const sessao = await obterSessaoUsuario();
  if (!sessao) return httpError("Não autenticado.", 401);

  try {
    const associacoes = await associacoesController.list();
    return httpOk(associacoes);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function createAssociacaoRoute(request: Request) {
  const negado = await exigirAcessoGestaoDeAssociacoes();
  if (negado) return negado;

  try {
    const body = await request.json();
    const parsed = createAssociacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const associacao = await associacoesController.create(parsed.data);
    return httpCreated(associacao);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function getAssociacaoByIdRoute(id: string) {
  const sessao = await obterSessaoUsuario();
  if (!sessao) return httpError("Não autenticado.", 401);

  try {
    const associacao = await associacoesController.getById(id);
    return httpOk(associacao);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function updateAssociacaoRoute(request: Request, id: string) {
  const negado = await exigirAcessoGestaoDeAssociacoes();
  if (negado) return negado;

  try {
    const body = await request.json();
    const parsed = updateAssociacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const associacao = await associacoesController.update(id, parsed.data);
    return httpOk(associacao);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
