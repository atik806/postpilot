import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";
import { asJson } from "@/lib/utils";

export async function recordAudit(params: {
  workspaceId: string;
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createSupabaseServiceRoleClient();
    await admin.from("audit_logs").insert({
      workspace_id: params.workspaceId,
      actor_id: params.actorId,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      metadata: asJson(params.metadata ?? {}),
    });
  } catch (err) {
    // Auditing must never break the primary action.
    logger.error("audit.write_failed", {
      action: params.action,
      err: String(err),
    });
  }
}
