import { NextResponse, type NextRequest } from "next/server";
import { processDueJobs } from "@/server/publishing";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(request: NextRequest) {
  const auth = request.headers.get("authorization");
  let expected: string;
  try {
    expected = `Bearer ${env.cronSecret()}`;
  } catch {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueJobs(20);
    logger.info("cron.publish", { ...result });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("cron.publish_failed", { err: String(err) });
    return NextResponse.json({ error: "Queue processing failed." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
