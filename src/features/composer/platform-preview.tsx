"use client";

import Image from "next/image";
import { Heart, MessageCircle, MoreHorizontal, Repeat2, Send, ThumbsUp } from "lucide-react";
import { PlatformIcon } from "@/components/social/platform-icon";
import { PLATFORM_META } from "@/lib/constants";
import type { Platform } from "@/types";
import type { MediaItem } from "./media-uploader";

interface Props {
  platform: Platform;
  content: string;
  media: MediaItem[];
  accountName: string;
}

function Media({ media }: { media: MediaItem[] }) {
  if (media.length === 0) return null;
  const first = media[0];
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
      {first.mimeType.startsWith("video/") ? (
        <video src={first.url} className="size-full object-cover" muted />
      ) : (
        <Image src={first.url} alt="" fill sizes="480px" className="object-cover" />
      )}
      {media.length > 1 && (
        <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 text-xs text-white">
          +{media.length - 1}
        </span>
      )}
    </div>
  );
}

export function PlatformPreview({ platform, content, media, accountName }: Props) {
  const name = accountName || `@${PLATFORM_META[platform].label.toLowerCase()}`;
  const text = content || "Your caption will appear here…";

  const header = (
    <div className="flex items-center gap-2">
      <div className="size-8 rounded-full bg-gradient-to-br from-primary/70 to-primary" />
      <div className="flex-1">
        <p className="text-sm font-semibold leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground">
          {platform === "linkedin" ? "Now · 🌐" : "Just now"}
        </p>
      </div>
      <MoreHorizontal className="size-4 text-muted-foreground" />
    </div>
  );

  const actions =
    platform === "x" ? (
      <div className="flex justify-between px-2 pt-1 text-muted-foreground">
        <MessageCircle className="size-4" />
        <Repeat2 className="size-4" />
        <Heart className="size-4" />
        <Send className="size-4" />
      </div>
    ) : platform === "instagram" ? (
      <div className="flex gap-4 pt-1 text-muted-foreground">
        <Heart className="size-5" />
        <MessageCircle className="size-5" />
        <Send className="size-5" />
      </div>
    ) : (
      <div className="flex gap-6 border-t pt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="size-4" /> Like
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-4" /> Comment
        </span>
        <span className="inline-flex items-center gap-1">
          <Repeat2 className="size-4" /> Share
        </span>
      </div>
    );

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <PlatformIcon platform={platform} brand className="size-3.5" />
        {PLATFORM_META[platform].label} preview
      </div>

      {platform === "instagram" ? (
        <div className="space-y-2">
          {header}
          <Media media={media.length ? media : []} />
          {media.length === 0 && (
            <div className="flex aspect-square items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              Instagram needs an image or video
            </div>
          )}
          {actions}
          <p className="whitespace-pre-wrap text-sm">
            <span className="font-semibold">{name} </span>
            {text}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {header}
          <p className="whitespace-pre-wrap text-sm">{text}</p>
          <Media media={media} />
          {actions}
        </div>
      )}
    </div>
  );
}
