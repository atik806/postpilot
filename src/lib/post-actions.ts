"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  cancelPost,
  deletePost,
  duplicatePost,
  getPost,
  publishPost,
  retryPostTarget,
  savePost,
  schedulePost,
  type PostDetail,
} from "@/server/posts";
import { registerMedia } from "@/server/media";
import { AppError } from "@/lib/errors";
import { PLATFORMS } from "@/types";
import type { ActionResult } from "@/lib/workspace-actions";

function fail(err: unknown): ActionResult<never> {
  return {
    ok: false,
    error: err instanceof AppError ? err.message : "Something went wrong.",
  };
}

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(160).nullish(),
  baseContent: z.string().max(60000),
  platformContent: z.partialRecord(z.enum(PLATFORMS), z.string()).optional(),
  mediaIds: z.array(z.string().uuid()).max(10).optional(),
  accountIds: z.array(z.string().uuid()).max(50),
  timezone: z.string().optional(),
});

export async function savePostAction(
  input: z.input<typeof saveSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = saveSchema.parse(input);
    const res = await savePost(parsed);
    revalidatePath("/posts");
    revalidatePath("/calendar");
    return { ok: true, data: res };
  } catch (err) {
    return fail(err);
  }
}

export async function publishPostAction(id: string): Promise<ActionResult> {
  try {
    await publishPost(id);
    revalidatePath("/posts");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function schedulePostAction(
  id: string,
  whenISO: string,
): Promise<ActionResult> {
  try {
    await schedulePost(id, whenISO);
    revalidatePath("/posts");
    revalidatePath("/calendar");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function cancelPostAction(id: string): Promise<ActionResult> {
  try {
    await cancelPost(id);
    revalidatePath("/posts");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  try {
    await deletePost(id);
    revalidatePath("/posts");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function duplicatePostAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const res = await duplicatePost(id);
    revalidatePath("/posts");
    return { ok: true, data: res };
  } catch (err) {
    return fail(err);
  }
}

export async function retryTargetAction(
  targetId: string,
): Promise<ActionResult> {
  try {
    await retryPostTarget(targetId);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function getPostStatusAction(
  id: string,
): Promise<ActionResult<PostDetail>> {
  try {
    const detail = await getPost(id);
    return { ok: true, data: detail };
  } catch (err) {
    return fail(err);
  }
}

const registerSchema = z.object({
  path: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullish(),
  height: z.number().int().positive().nullish(),
  duration: z.number().positive().nullish(),
});

export async function registerMediaAction(
  input: z.input<typeof registerSchema>,
): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    const parsed = registerSchema.parse(input);
    const res = await registerMedia(parsed);
    return { ok: true, data: res };
  } catch (err) {
    return fail(err);
  }
}
