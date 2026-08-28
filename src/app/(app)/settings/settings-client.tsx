"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  updateProfileAction,
  updateWorkspaceNameAction,
} from "@/lib/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function SettingsClient({
  name,
  timezone,
  workspaceName,
  canRenameWorkspace,
}: {
  name: string;
  timezone: string;
  workspaceName: string;
  canRenameWorkspace: boolean;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();

  const [profileName, setProfileName] = useState(name);
  const [tz, setTz] = useState(timezone);
  const [wsName, setWsName] = useState(workspaceName);

  function saveProfile() {
    startTransition(async () => {
      const res = await updateProfileAction({ name: profileName, timezone: tz });
      if (res.ok) {
        toast.success("Profile updated.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function saveWorkspace() {
    startTransition(async () => {
      const res = await updateWorkspaceNameAction(wsName);
      if (res.ok) {
        toast.success("Workspace updated.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={tz} onValueChange={setTz}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...new Set([tz, ...TIMEZONES])].map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used as the default when scheduling posts.
            </p>
          </div>
          <Button onClick={saveProfile} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label>Theme</Label>
          <Select value={theme ?? "system"} onValueChange={setTheme}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="w-name">Workspace name</Label>
            <Input
              id="w-name"
              value={wsName}
              disabled={!canRenameWorkspace}
              onChange={(e) => setWsName(e.target.value)}
            />
          </div>
          {canRenameWorkspace && (
            <Button onClick={saveWorkspace} disabled={pending} variant="outline">
              {pending && <Loader2 className="animate-spin" />}
              Rename workspace
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
