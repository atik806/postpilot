"use client";

import { useState, useTransition } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/team-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials } from "@/lib/utils";
import { WORKSPACE_ROLES, type WorkspaceRole } from "@/types";
import type { WorkspaceMemberView } from "@/server/workspaces";

export function TeamClient({
  members,
  canManage,
  currentUserId,
}: {
  members: WorkspaceMemberView[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("EDITOR");
  const [pending, startTransition] = useTransition();

  function invite() {
    startTransition(async () => {
      const res = await inviteMemberAction({ email, role });
      if (res.ok) {
        toast.success(
          res.data!.added
            ? "Member added."
            : "They'll be added when they create a PostPilot account.",
        );
        setEmail("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Invite by email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
              />
            </div>
            <div className="w-36 space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKSPACE_ROLES.filter((r) => r !== "OWNER").map((r) => (
                    <SelectItem key={r} value={r}>
                      {r[0] + r.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={invite} disabled={pending || !email.includes("@")}>
              {pending ? <Loader2 className="animate-spin" /> : <UserPlus className="size-4" />}
              Invite
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback>
                        {initials(m.profile.name ?? m.profile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {m.profile.name ?? m.profile.email}
                        {m.profile.id === currentUserId && (
                          <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.profile.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {canManage && m.role !== "OWNER" ? (
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        defaultValue={m.role}
                        onValueChange={(v) =>
                          startTransition(async () => {
                            const res = await updateMemberRoleAction(m.id, v);
                            if (res.ok) router.refresh();
                            else toast.error(res.error);
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKSPACE_ROLES.filter((r) => r !== "OWNER").map((r) => (
                            <SelectItem key={r} value={r}>
                              {r[0] + r.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await removeMemberAction(m.id);
                            if (res.ok) router.refresh();
                            else toast.error(res.error);
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {m.role}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
