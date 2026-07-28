import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { sessionCookieName } from "@/modules/auth/presentation/routes/session-cookie";

export default withAuth(
  function middleware(request) {
    const mustChangePassword = Boolean(request.nextauth.token?.mustChangePassword);
    const { pathname } = request.nextUrl;

    if (mustChangePassword && pathname !== "/trocar-senha") {
      return NextResponse.redirect(new URL("/trocar-senha", request.url));
    }

    if (!mustChangePassword && pathname === "/trocar-senha") {
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
  matcher: ["/cadastros/:path*", "/trocar-senha"],
};
