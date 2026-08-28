"use client";

import { useState, useTransition } from "react";
import { Loader2, Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCampaignAction } from "@/lib/campaign-actions";
import { PlatformIcon } from "@/components/social/platform-icon";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CampaignView } from "@/server/campaigns";

export function CampaignsClient({ campaigns }: { campaigns: CampaignView[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      const res = await createCampaignAction({ name, description });
      if (res.ok) {
        toast.success("Campaign created.");
        setOpen(false);
        setName("");
        setDescription("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  const newButton = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website launch"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A 7-day launch sequence across all platforms."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={create} disabled={pending || name.trim().length < 2}>
            {pending && <Loader2 className="animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{newButton}</div>
      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Group related posts into a multi-day campaign to track them together."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const pct = c.postCount
              ? Math.round((c.publishedCount / c.postCount) * 100)
              : 0;
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{c.name}</p>
                    <Badge variant="muted">{c.status.toLowerCase()}</Badge>
                  </div>
                  {c.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{c.postCount} posts</span>
                    <span className="flex gap-1">
                      {c.platforms.map((p) => (
                        <PlatformIcon key={p} platform={p} className="size-3.5" />
                      ))}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.publishedCount}/{c.postCount} published
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
