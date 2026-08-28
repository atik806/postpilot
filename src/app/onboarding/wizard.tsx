"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createWorkspaceAction } from "@/lib/workspace-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      Create workspace
    </Button>
  );
}

export function OnboardingWizard({
  name,
  allowSkip,
}: {
  name: string | null;
  allowSkip: boolean;
}) {
  const [state, formAction] = useActionState(createWorkspaceAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to PostPilot{name ? `, ${name.split(" ")[0]}` : ""} 👋</CardTitle>
        <CardDescription>
          Let&apos;s set up your workspace. You&apos;ll connect social accounts
          and create your first post next.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              name="name"
              required
              autoFocus
              placeholder="Acme Inc."
            />
            <p className="text-xs text-muted-foreground">
              Usually your company or brand name.
            </p>
          </div>
          {state && !state.ok && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Submit />
          {allowSkip && (
            <Button asChild variant="ghost" className="w-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
