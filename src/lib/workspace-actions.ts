"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createWorkspace, setActiveWorkspace } from "@/server/workspaces";
import { AppError } from "@/lib/errors";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function switchWorkspaceAction(
  workspaceId: string,
): Promise<ActionResult> {
  try {
    await setActiveWorkspace(workspaceId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof AppError ? err.message : "Failed." };
  }
}

export async function createWorkspaceAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = z
    .object({ name: z.string().trim().min(2).max(60) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Enter a workspace name (2–60 characters)." };
  }
  try {
    await createWorkspace(parsed.data.name);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Could not create workspace.",
    };
  }
  redirect("/dashboard");
}
