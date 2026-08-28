"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";
import { switchWorkspaceAction } from "@/lib/workspace-actions";
import type { WorkspaceRole } from "@/types";

interface Props {
  active: { id: string; name: string };
  memberships: { workspace: { id: string; name: string }; role: WorkspaceRole }[];
}

export function WorkspaceSwitcher({ active, memberships }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(id: string) {
    if (id === active.id) return;
    startTransition(async () => {
      await switchWorkspaceAction(id);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors hover:bg-accent",
          pending && "opacity-60",
        )}
      >
        <span className="flex size-7 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
          {initials(active.name)}
        </span>
        <span className="flex-1 truncate font-medium">{active.name}</span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.workspace.id}
            onSelect={() => switchTo(m.workspace.id)}
          >
            <span className="flex size-6 items-center justify-center rounded bg-muted text-[10px] font-semibold">
              {initials(m.workspace.name)}
            </span>
            <span className="flex-1 truncate">{m.workspace.name}</span>
            <span className="text-xs text-muted-foreground">{m.role.toLowerCase()}</span>
            {m.workspace.id === active.id && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/onboarding?new=1")}>
          <Plus className="size-4" />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
