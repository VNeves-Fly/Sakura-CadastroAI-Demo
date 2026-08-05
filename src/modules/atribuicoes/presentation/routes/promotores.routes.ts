import { NextResponse } from "next/server";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { DomainError, NotFoundError, ConflictError } from "@/modules/shared/domain/errors";
import { obterSessaoUsuario } from "@/modules/auth/presentation/utils/sessao.util";
import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaGestorRepository } from "@/modules/gestores/infrastructure/repositories/prisma-gestor.repository";
import { promotoresController } from "@/modules/atribuicoes/presentation/controllers/promotores.controller";
import { createPromotorSchema } from "@/modules/atribuicoes/application/dto/create-promotor.schema";
import { updatePromotorSchema } from "@/modules/atribuicoes/application/dto/update-promotor.schema";

const gestorRepository = new PrismaGestorRepository(prisma);

// Quem pode cadastrar/editar Executivo (decisão do usuário, 2026-08-03):
// Admin/Diretor cadastram qualquer um; Gestor só embaixo de si mesmo
// (gestorId travado, ignora o que vier do body); Executivo/Analista não
// cadastram nada.
type AcessoPromotores =
  { tipo: "negado" } | { tipo: "total" } | { tipo: "escopado"; gestorId: string };

async function resolverAcessoPromotores(): Promise<AcessoPromotores> {
  const sessao = await obterSessaoUsuario();
  if (!sessao) return { tipo: "negado" };
  if (sessao.cargo === "ADMIN" || sessao.cargo === "DIRETOR_ANALISTA") return { tipo: "total" };
  if (sessao.cargo === "GESTOR") {
    const gestor = await gestorRepository.findByUserId(sessao.id);
    if (!gestor) return { tipo: "negado" };
    return { tipo: "escopado", gestorId: gestor.id };
  }
  return { tipo: "negado" };
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

export async function listPromotoresRoute() {
  const acesso = await resolverAcessoPromotores();
  if (acesso.tipo === "negado") return httpError("Acesso não permitido.", 403);

  try {
    const promotores = await promotoresController.list();
    const visiveis =
      acesso.tipo === "escopado"
        ? promotores.filter((promotor) => promotor.gestorId === acesso.gestorId)
        : promotores;
    return httpOk(visiveis);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function createPromotorRoute(request: Request) {
  const acesso = await resolverAcessoPromotores();
  if (acesso.tipo === "negado") return httpError("Acesso não permitido.", 403);

  try {
    const body = await request.json();
    const parsed = createPromotorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    // Gestor nunca escolhe o gestorId — sempre o dele mesmo, travado aqui,
    // nunca no que veio do body.
    const gestorId = acesso.tipo === "escopado" ? acesso.gestorId : parsed.data.gestorId;

    const promotor = await promotoresController.create({ ...parsed.data, gestorId });
    return httpCreated(promotor);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function getPromotorByIdRoute(id: string) {
  const acesso = await resolverAcessoPromotores();
  if (acesso.tipo === "negado") return httpError("Acesso não permitido.", 403);

  try {
    const promotor = await promotoresController.getById(id);
    if (acesso.tipo === "escopado" && promotor.gestorId !== acesso.gestorId) {
      return httpError("Acesso não permitido.", 403);
    }
    return httpOk(promotor);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function updatePromotorRoute(request: Request, id: string) {
  const acesso = await resolverAcessoPromotores();
  if (acesso.tipo === "negado") return httpError("Acesso não permitido.", 403);

  try {
    if (acesso.tipo === "escopado") {
      const atual = await promotoresController.getById(id);
      if (atual.gestorId !== acesso.gestorId) {
        return httpError("Acesso não permitido.", 403);
      }
    }

    const body = await request.json();
    const parsed = updatePromotorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const gestorId = acesso.tipo === "escopado" ? acesso.gestorId : parsed.data.gestorId;

    const promotor = await promotoresController.update(id, { ...parsed.data, gestorId });
    return httpOk(promotor);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
