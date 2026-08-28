import { NextResponse, type NextRequest } from "next/server";
import { completeConnect } from "@/server/social-accounts";
import { PLATFORMS, type Platform } from "@/types";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ platform: string }> },
) {
  const { platform } = await ctx.params;
  const { origin } = request.nextUrl;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  const back = (params: string) =>
    NextResponse.redirect(`${origin}/social-accounts?${params}`);

  if (!PLATFORMS.includes(platform as Platform)) {
    return back("error=unknown_platform");
  }
  if (oauthError) {
    return back(`error=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state) {
    return back("error=missing_code");
  }

  try {
    await completeConnect({ platform: platform as Platform, code, state });
    return back(`connected=${platform}`);
  } catch (err) {
    logger.warn("social.callback_failed", { platform, err: String(err) });
    return back(
      `error=${encodeURIComponent(
        err instanceof Error ? err.message : "connection_failed",
      )}`,
    );
  }
}
