import type { Metadata } from "next";
import { listSocialAccounts } from "@/server/social-accounts";
import { platformConnectionModes } from "@/lib/social/registry";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { AccountsClient } from "./accounts-client";

export const metadata: Metadata = { title: "Social Accounts" };

export default async function SocialAccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [accounts, params] = await Promise.all([
    listSocialAccounts(),
    searchParams,
  ]);
  const modes = platformConnectionModes();

  return (
    <PageBody>
      <PageHeader
        title="Social Accounts"
        description="Connect your platforms and manage everything from one place."
      />
      {params?.connected && (
        <p className="rounded-md bg-success/10 p-3 text-sm text-success">
          {String(params.connected)} connected successfully.
        </p>
      )}
      {params?.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Couldn&apos;t connect: {String(params.error)}
        </p>
      )}
      <AccountsClient
        accounts={accounts.map((a) => ({
          id: a.id,
          platform: a.platform,
          accountName: a.accountName,
          status: a.status,
          isSandbox: a.isSandbox,
          lastSyncedAt: a.lastSyncedAt,
          createdAt: a.createdAt,
        }))}
        modes={modes}
      />
    </PageBody>
  );
}
