import type { Metadata } from "next";
import { requireWorkspaceContext } from "@/server/session";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireWorkspaceContext();
  return (
    <PageBody className="max-w-3xl">
      <PageHeader title="Settings" description="Manage your profile and workspace." />
      <SettingsClient
        name={ctx.user.profile.name ?? ""}
        timezone={ctx.user.profile.timezone}
        workspaceName={ctx.workspace.name}
        canRenameWorkspace={["OWNER", "ADMIN"].includes(ctx.role)}
      />
    </PageBody>
  );
}
