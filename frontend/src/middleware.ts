import { NextResponse, type NextRequest } from "next/server";

/**
 * O middleware faz somente uma checagem de cookie hint para evitar
 * que rotas /dashboard/* sejam acessadas sem login. A validação real
 * acontece nos client components que leem o storage e redirecionam.
 *
 * Esse hint é gravado pelo `AuthGuard` ao detectar uma sessão local.
 */
const HINT_COOKIE = "skillflow.session_hint";
const PROTECTED_PATH = /^\/dashboard(\/.*)?$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED_PATH.test(pathname)) return NextResponse.next();
  const hint = request.cookies.get(HINT_COOKIE)?.value;
  if (!hint) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
