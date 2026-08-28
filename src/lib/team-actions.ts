"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/server/workspaces";
import { AppError } from "@/lib/errors";
import { WORKSPACE_ROLES } from "@/types";
import type { ActionResult } from "@/lib/workspace-actions";

function fail(err: unknown): ActionResult<never> {
  return {
    ok: false,
    error: err instanceof AppError ? err.message : "Something went wrong.",
  };
}

export async function inviteMemberAction(
  input: { email: string; role: string },
): Promise<ActionResult<{ added: boolean }>> {
  try {
    const parsed = z
      .object({ email: z.string().email(), role: z.enum(WORKSPACE_ROLES) })
      .parse(input);
    const res = await inviteMember(parsed.email, parsed.role);
    revalidatePath("/team");
    return { ok: true, data: res };
  } catch (err) {
    return fail(err);
  }
}

export async function updateMemberRoleAction(
  memberId: string,
  role: string,
): Promise<ActionResult> {
  try {
    const parsed = z.enum(WORKSPACE_ROLES).parse(role);
    await updateMemberRole(memberId, parsed);
    revalidatePath("/team");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function removeMemberAction(
  memberId: string,
): Promise<ActionResult> {
  try {
    await removeMember(memberId);
    revalidatePath("/team");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
