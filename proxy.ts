import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionCookie, SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  // Vercel's cron invoker and the login/logout endpoints authenticate
  // themselves (CRON_SECRET, the password check) — never gate these
  // behind the session cookie.
  if (request.nextUrl.pathname.startsWith("/api/cron") || request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const authenticated = isValidSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!authenticated && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, icon, and the login hero/brand images (must load pre-auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|header-banner.png|login/).*)",
  ],
};
