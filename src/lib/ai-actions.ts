"use server";

import { z } from "zod";
import { aiGenerateCaption, aiHashtags, aiRewrite } from "@/server/ai";
import { AppError } from "@/lib/errors";
import { PLATFORMS, TONES } from "@/types";
import type { ActionResult } from "@/lib/workspace-actions";
import type { CaptionResult } from "@/lib/ai/types";

function fail(err: unknown): ActionResult<never> {
  return {
    ok: false,
    error: err instanceof AppError ? err.message : "The AI request failed.",
  };
}

const captionSchema = z.object({
  topic: z.string().min(3).max(2000),
  platform: z.enum(PLATFORMS),
  tone: z.enum(TONES),
  audience: z.string().max(200).optional(),
  cta: z.string().max(200).optional(),
  postId: z.string().uuid().nullish(),
});

export async function generateCaptionAction(
  input: z.input<typeof captionSchema>,
): Promise<ActionResult<CaptionResult>> {
  try {
    const p = captionSchema.parse(input);
    const res = await aiGenerateCaption(p, p.postId);
    return { ok: true, data: res };
  } catch (err) {
    return fail(err);
  }
}

const rewriteSchema = z.object({
  content: z.string().min(1).max(60000),
  platform: z.enum(PLATFORMS),
  tone: z.enum(TONES),
  instruction: z.string().max(200).optional(),
  postId: z.string().uuid().nullish(),
});

export async function rewriteAction(
  input: z.input<typeof rewriteSchema>,
): Promise<ActionResult<{ text: string }>> {
  try {
    const p = rewriteSchema.parse(input);
    const res = await aiRewrite(p, p.postId);
    return { ok: true, data: res };
  } catch (err) {
    return fail(err);
  }
}

const hashtagsSchema = z.object({
  content: z.string().min(1).max(60000),
  platform: z.enum(PLATFORMS),
  count: z.number().int().min(1).max(30).optional(),
  postId: z.string().uuid().nullish(),
});

export async function hashtagsAction(
  input: z.input<typeof hashtagsSchema>,
): Promise<ActionResult<{ hashtags: string[] }>> {
  try {
    const p = hashtagsSchema.parse(input);
    const res = await aiHashtags(p, p.postId);
    return { ok: true, data: res };
  } catch (err) {
    return fail(err);
  }
}
