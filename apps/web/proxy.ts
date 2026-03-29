import { headers } from "next/dist/server/request/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "./lib/auth"

const publicPaths = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-next-pathname", request.nextUrl.pathname)

  // Allow public paths
  if (publicPaths.some((path) => pathname === path)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Allow auth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  console.log("Session:", session) // Debugging line to check session value

  // Check for session token cookie
  // const sessionToken =
  //   request.cookies.get("better-auth.session_token")?.value ||
  //   request.cookies.get("__Secure-better-auth.session_token")?.value

  if (!session) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
