import { NextResponse } from "next/server";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { DomainError, NotFoundError, ConflictError } from "@/modules/shared/domain/errors";
import { usersController } from "@/modules/users/presentation/controllers/users.controller";
import { createUserSchema } from "@/modules/users/application/dto/create-user.schema";
import { changePasswordSchema } from "@/modules/users/application/dto/change-password.schema";

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

export async function listUsersRoute() {
  try {
    const users = await usersController.list();
    return httpOk(users);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function createUserRoute(request: Request) {
  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const user = await usersController.create(parsed.data);
    return httpCreated(user);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function getUserByIdRoute(id: string) {
  try {
    const user = await usersController.getById(id);
    return httpOk(user);
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function changePasswordRoute(request: Request, userId: string) {
  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    await usersController.changePassword({ userId, newPassword: parsed.data.newPassword });
    return httpOk({ success: true });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
