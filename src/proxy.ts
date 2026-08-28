import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/create",
  "/calendar",
  "/posts",
  "/campaigns",
  "/analytics",
  "/social-accounts",
  "/ai-studio",
  "/team",
  "/billing",
  "/settings",
  "/onboarding",
];

const AUTH_PAGES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response: Awaited<ReturnType<typeof updateSession>>["response"];
  let user: Awaited<ReturnType<typeof updateSession>>["user"];
  try {
    ({ response, user } = await updateSession(request));
  } catch {
    // Never let an auth-refresh failure take down the whole site.
    return NextResponse.next({ request });
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
