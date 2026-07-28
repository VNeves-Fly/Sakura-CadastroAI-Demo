import { NextResponse } from "next/server";
import { httpCreated, httpError, httpOk } from "@/modules/shared/presentation/http-response";
import {
  DomainError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from "@/modules/shared/domain/errors";
import { obterIpCliente, verificarRateLimit } from "@/modules/shared/infrastructure/rate-limiter";
import { obterUrlBase } from "@/modules/shared/utils/url-base.util";
import { usersController } from "@/modules/users/presentation/controllers/users.controller";
import { createUserSchema } from "@/modules/users/application/dto/create-user.schema";
import { changePasswordSchema } from "@/modules/users/application/dto/change-password.schema";
import { requestPasswordResetSchema } from "@/modules/users/application/dto/request-password-reset.schema";
import { verifyPasswordResetSchema } from "@/modules/users/application/dto/verify-password-reset.schema";
import { resetPasswordSchema } from "@/modules/users/application/dto/reset-password.schema";

// Pedido de OTP por e-mail: poucas tentativas por IP bastam num fluxo
// legítimo (usuário pede uma vez, no máximo reenvia depois de errar o
// e-mail) — mesmo espírito de RATE_LIMIT_SUBMIT em cadastro-publico.routes.ts.
const RATE_LIMIT_RECUPERAR_SENHA = { limite: 5, janelaMs: 15 * 60 * 1000 };
// Verificação de código: segunda camada de defesa sobre o limite de
// tentativas por token (que já é a proteção principal).
const RATE_LIMIT_VERIFICAR_CODIGO = { limite: 20, janelaMs: 10 * 60 * 1000 };
// Disparo pelo admin em /cadastros/usuarios: sessão já autentica quem chama,
// isto só contém spam ao usuário-alvo (inbox) em caso de clique repetido.
const RATE_LIMIT_ADMIN_RECUPERAR_SENHA = { limite: 3, janelaMs: 15 * 60 * 1000 };

function mapErrorToResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return httpError(error.message, 429);
  }
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

export async function requestPasswordResetRoute(request: Request) {
  try {
    const chaveRateLimit = `recuperar-senha:${obterIpCliente(request)}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_RECUPERAR_SENHA)) {
      throw new RateLimitError();
    }

    const body = await request.json();
    const parsed = requestPasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    // Sempre 200 em input válido — nunca revela se o e-mail existe.
    await usersController.requestPasswordReset({
      ...parsed.data,
      baseUrl: obterUrlBase(request.headers),
    });
    return httpOk({ success: true });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function requestPasswordResetForUserRoute(userId: string, baseUrl: string) {
  try {
    const chaveRateLimit = `admin-recuperar-senha:${userId}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_ADMIN_RECUPERAR_SENHA)) {
      throw new RateLimitError();
    }

    await usersController.requestPasswordResetForUser(userId, baseUrl);
    return httpOk({ success: true });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function verifyPasswordResetCodeRoute(request: Request) {
  try {
    const chaveRateLimit = `recuperar-senha-verificar:${obterIpCliente(request)}`;
    if (!verificarRateLimit(chaveRateLimit, RATE_LIMIT_VERIFICAR_CODIGO)) {
      throw new RateLimitError();
    }

    const body = await request.json();
    const parsed = verifyPasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    await usersController.verifyPasswordResetCode(parsed.data);
    return httpOk({ success: true });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function resetPasswordRoute(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    await usersController.resetPassword(parsed.data);
    return httpOk({ success: true });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
