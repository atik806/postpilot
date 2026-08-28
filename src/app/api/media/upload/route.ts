import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requestUpload } from "@/server/media";
import { toErrorResponse } from "@/lib/errors";

const schema = z.object({
  mimeType: z.string().min(3),
  sizeBytes: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const ticket = await requestUpload(body);
    return NextResponse.json({
      ...ticket,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
