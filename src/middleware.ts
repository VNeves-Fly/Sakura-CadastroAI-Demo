import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { sessionCookieName } from "@/modules/auth/presentation/routes/session-cookie";

// Gestor/Executivo não podem assumir atendimento (decisão do usuário,
// 2026-08-03) — bloqueados da página inteira aqui, além do guard de API em
// atendimento-agencia.routes.ts (defesa em profundidade, ver Fase 9).
const CARGOS_SEM_ATENDIMENTO = new Set(["GESTOR", "EXECUTIVO"]);

export default withAuth(
  function middleware(request) {
    const mustChangePassword = Boolean(request.nextauth.token?.mustChangePassword);
    const cargo = request.nextauth.token?.cargo as string | undefined;
    const { pathname } = request.nextUrl;

    if (mustChangePassword && pathname !== "/trocar-senha") {
      return NextResponse.redirect(new URL("/trocar-senha", request.url));
    }

    if (!mustChangePassword && pathname === "/trocar-senha") {
      return NextResponse.redirect(new URL("/cadastros", request.url));
    }

    if (pathname.startsWith("/atendimento") && cargo && CARGOS_SEM_ATENDIMENTO.has(cargo)) {
      return NextResponse.redirect(new URL("/cadastros", request.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    cookies: { sessionToken: { name: sessionCookieName } },
  },
);

export const config = {
  matcher: ["/cadastros/:path*", "/trocar-senha", "/atendimento/:path*"],
};
