"use server";

import { revalidatePath } from "next/cache";
import {
  beginConnect,
  disconnectAccount,
} from "@/server/social-accounts";
import { AppError } from "@/lib/errors";
import type { Platform } from "@/types";
import type { ActionResult } from "@/lib/workspace-actions";

export async function connectAccountAction(
  platform: Platform,
  reauthAccountId?: string,
): Promise<ActionResult<{ authUrl: string }>> {
  try {
    const { authUrl } = await beginConnect(platform, { reauthAccountId });
    return { ok: true, data: { authUrl } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Could not start the connection.",
    };
  }
}

export async function disconnectAccountAction(
  accountId: string,
): Promise<ActionResult> {
  try {
    await disconnectAccount(accountId);
    revalidatePath("/social-accounts");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Could not disconnect.",
    };
  }
}
