import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")
  const isLogin = request.nextUrl.pathname === "/login"

  // ponytail: presence check only — real verification is the API guard; middleware just gates UX.
  if (!token && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (token && isLogin) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
