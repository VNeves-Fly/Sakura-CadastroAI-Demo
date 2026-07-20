import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const mustChangePassword = Boolean(request.nextauth.token?.mustChangePassword);
    const { pathname } = request.nextUrl;

    if (mustChangePassword && pathname !== "/trocar-senha") {
      return NextResponse.redirect(new URL("/trocar-senha", request.url));
    }

    if (!mustChangePassword && pathname === "/trocar-senha") {
      return NextResponse.redirect(new URL("/painel", request.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/painel/:path*", "/trocar-senha"],
};
