"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateProfile, updateWorkspaceName } from "@/server/profile";
import { AppError } from "@/lib/errors";
import type { ActionResult } from "@/lib/workspace-actions";

function fail(err: unknown): ActionResult<never> {
  return {
    ok: false,
    error: err instanceof AppError ? err.message : "Something went wrong.",
  };
}

export async function updateProfileAction(
  input: { name?: string; timezone?: string },
): Promise<ActionResult> {
  try {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        timezone: z.string().max(64).optional(),
      })
      .parse(input);
    await updateProfile(parsed);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updateWorkspaceNameAction(
  name: string,
): Promise<ActionResult> {
  try {
    await updateWorkspaceName(name);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
