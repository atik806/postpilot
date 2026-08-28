import type { Metadata } from "next";
import { listMembers } from "@/server/workspaces";
import { requireWorkspaceContext } from "@/server/session";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { TeamClient } from "./team-client";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const [ctx, members] = await Promise.all([
    requireWorkspaceContext(),
    listMembers(),
  ]);
  const canManage = ["OWNER", "ADMIN"].includes(ctx.role);

  return (
    <PageBody>
      <PageHeader
        title="Team"
        description={`Members of ${ctx.workspace.name}.`}
      />
      <TeamClient
        members={members}
        canManage={canManage}
        currentUserId={ctx.user.id}
      />
    </PageBody>
  );
}
