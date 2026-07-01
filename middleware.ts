import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Rotas /admin/* exigem role ADMIN
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/moradora/inicio", req.url));
    }

    // Redireciona raiz do dashboard conforme role
    if (pathname === "/") {
      const destino = role === "ADMIN" ? "/admin/moradoras" : "/moradora/inicio";
      return NextResponse.redirect(new URL(destino, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/moradora/:path*",
    "/((?!login|api|_next/static|_next/image|favicon.ico|arco-flor.svg).*)",
  ],
};
