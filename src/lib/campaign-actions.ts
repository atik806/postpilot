"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCampaign } from "@/server/campaigns";
import { AppError } from "@/lib/errors";
import type { ActionResult } from "@/lib/workspace-actions";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  startsOn: z.string().optional(),
});

export async function createCampaignAction(
  input: z.input<typeof schema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = schema.parse(input);
    const res = await createCampaign({
      name: parsed.name,
      description: parsed.description,
      startsOn: parsed.startsOn || null,
    });
    revalidatePath("/campaigns");
    return { ok: true, data: res };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Could not create campaign.",
    };
  }
}
