import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { errors } from "@/lib/errors";
import { env } from "@/lib/env";
import { encryptToken, decryptTokenOrNull } from "@/lib/crypto/tokens";
import { asJson } from "@/lib/utils";
import { getSocialProvider } from "@/lib/social/registry";
import type { PublishAccount } from "@/lib/social/types";
import { CAPABILITIES } from "@/lib/social/capabilities";
import { recordAudit } from "@/server/audit";
import { assertWithinPlan } from "@/server/limits";
import { assertRole, requireWorkspaceContext } from "@/server/session";
import { PLATFORMS, type Platform } from "@/types";
import type { SocialAccountRow } from "@/types/database.types";

const OAUTH_STATE_COOKIE = "pp_oauth_state";

function redirectUri(platform: Platform): string {
  return `${env.appUrl.replace(/\/$/, "")}/api/social/${platform}/callback`;
}

export interface SocialAccountView {
  id: string;
  platform: Platform;
  accountName: string;
  status: SocialAccountRow["status"];
  isSandbox: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  capabilities: (typeof CAPABILITIES)[Platform];
}

export async function listSocialAccounts(): Promise<SocialAccountView[]> {
  const ctx = await requireWorkspaceContext();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: true });

  return (data ?? []).map((a) => ({
    id: a.id,
    platform: a.platform,
    accountName: a.account_name,
    status: a.status,
    isSandbox: a.is_sandbox,
    lastSyncedAt: a.last_synced_at,
    createdAt: a.created_at,
    capabilities: CAPABILITIES[a.platform],
  }));
}

/** Publishable accounts (CONNECTED) for the composer. */
export async function listPublishableAccounts(): Promise<SocialAccountView[]> {
  return (await listSocialAccounts()).filter((a) => a.status === "CONNECTED");
}

export async function beginConnect(
  platform: Platform,
  opts: { reauthAccountId?: string } = {},
): Promise<{ authUrl: string }> {
  if (!PLATFORMS.includes(platform)) throw errors.validation("Unknown platform.");
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "ADMIN");

  if (!opts.reauthAccountId) {
    await assertWithinPlan(ctx.workspace.id, ctx.subscription, "connect_social_account");
  }

  const provider = getSocialProvider(platform);
  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({
      state,
      platform,
      workspaceId: ctx.workspace.id,
      reauthAccountId: opts.reauthAccountId ?? null,
    }),
    { path: "/", httpOnly: true, sameSite: "lax", maxAge: 600 },
  );

  const authUrl = provider.getAuthUrl({
    state,
    redirectUri: redirectUri(platform),
    reauthAccountId: opts.reauthAccountId,
  });
  return { authUrl };
}

export async function completeConnect(params: {
  platform: Platform;
  code: string;
  state: string;
}): Promise<{ workspaceId: string; accountId: string }> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  if (!raw) throw errors.validation("Your connection request expired. Try again.");
  cookieStore.delete(OAUTH_STATE_COOKIE);

  let parsed: {
    state: string;
    platform: Platform;
    workspaceId: string;
    reauthAccountId: string | null;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw errors.validation("Invalid connection state.");
  }
  if (parsed.state !== params.state || parsed.platform !== params.platform) {
    throw errors.forbidden("Connection state mismatch.");
  }

  // Confirm the caller is still an admin of that workspace.
  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.workspaceId)
    .maybeSingle();
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw errors.forbidden("You can't connect accounts for this workspace.");
  }

  const provider = getSocialProvider(params.platform);
  const connected = await provider.handleCallback({
    code: params.code,
    state: params.state,
    redirectUri: redirectUri(params.platform),
  });

  const admin = createSupabaseServiceRoleClient();
  const { data: account, error } = await admin
    .from("social_accounts")
    .upsert(
      {
        workspace_id: parsed.workspaceId,
        platform: params.platform,
        account_name: connected.accountName,
        external_account_id: connected.externalAccountId,
        status: "CONNECTED",
        is_sandbox: provider.isSandbox,
        metadata: asJson(connected.metadata ?? {}),
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,platform,external_account_id" },
    )
    .select("id")
    .single();
  if (error || !account) throw errors.internal("Could not save the account.");

  await admin.from("social_account_secrets").upsert({
    social_account_id: account.id,
    access_token_encrypted: encryptToken(connected.accessToken),
    refresh_token_encrypted: connected.refreshToken
      ? encryptToken(connected.refreshToken)
      : null,
    token_expires_at: connected.tokenExpiresAt ?? null,
  });

  await recordAudit({
    workspaceId: parsed.workspaceId,
    actorId: null,
    action: parsed.reauthAccountId ? "social_account.reauthorized" : "social_account.connected",
    targetType: "social_account",
    targetId: account.id,
    metadata: { platform: params.platform, sandbox: provider.isSandbox },
  });

  return { workspaceId: parsed.workspaceId, accountId: account.id };
}

export async function disconnectAccount(accountId: string): Promise<void> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "ADMIN");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("social_accounts")
    .update({ status: "DISCONNECTED" })
    .eq("id", accountId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) throw errors.internal("Could not disconnect the account.");

  const admin = createSupabaseServiceRoleClient();
  await admin
    .from("social_account_secrets")
    .update({ access_token_encrypted: null, refresh_token_encrypted: null })
    .eq("social_account_id", accountId);

  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "social_account.disconnected",
    targetType: "social_account",
    targetId: accountId,
  });
}

/**
 * Service-role helper for the publishing worker: returns the account with its
 * decrypted access token. Never expose the result to the client.
 */
export async function getPublishAccount(
  socialAccountId: string,
): Promise<{ account: PublishAccount; platform: Platform; isSandbox: boolean }> {
  const admin = createSupabaseServiceRoleClient();
  const { data: account } = await admin
    .from("social_accounts")
    .select("*")
    .eq("id", socialAccountId)
    .single();
  if (!account) throw errors.notFound("Social account not found.");

  const { data: secret } = await admin
    .from("social_account_secrets")
    .select("*")
    .eq("social_account_id", socialAccountId)
    .maybeSingle();

  return {
    platform: account.platform,
    isSandbox: account.is_sandbox,
    account: {
      externalAccountId: account.external_account_id,
      accountName: account.account_name,
      accessToken: decryptTokenOrNull(secret?.access_token_encrypted),
      refreshToken: decryptTokenOrNull(secret?.refresh_token_encrypted),
      metadata: (account.metadata as Record<string, unknown>) ?? {},
    },
  };
}

export async function markAccountStatus(
  socialAccountId: string,
  status: SocialAccountRow["status"],
): Promise<void> {
  const admin = createSupabaseServiceRoleClient();
  await admin
    .from("social_accounts")
    .update({ status, last_synced_at: new Date().toISOString() })
    .eq("id", socialAccountId);
}
