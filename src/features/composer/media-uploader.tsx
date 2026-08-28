"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerMediaAction } from "@/lib/post-actions";
import { cn } from "@/lib/utils";
import { MEDIA_LIMITS } from "@/lib/constants";

export interface MediaItem {
  id: string;
  url: string;
  mimeType: string;
}

export function MediaUploader({
  items,
  onChange,
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (items.length + files.length > MEDIA_LIMITS.maxPerPost) {
      toast.error(`You can attach up to ${MEDIA_LIMITS.maxPerPost} files.`);
      return;
    }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const added: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const ticketRes = await fetch("/api/media/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });
        const ticket = await ticketRes.json();
        if (!ticketRes.ok) {
          toast.error(ticket?.error?.message ?? "Upload failed.");
          continue;
        }
        const { error: upErr } = await supabase.storage
          .from(ticket.bucket)
          .uploadToSignedUrl(ticket.path, ticket.token, file);
        if (upErr) {
          toast.error(`Couldn't upload ${file.name}.`);
          continue;
        }
        const dims = await imageDimensions(file).catch(() => null);
        const reg = await registerMediaAction({
          path: ticket.path,
          mimeType: file.type,
          sizeBytes: file.size,
          width: dims?.width,
          height: dims?.height,
        });
        if (reg.ok) {
          added.push({
            id: reg.data!.id,
            url: reg.data!.url,
            mimeType: file.type,
          });
        } else {
          toast.error(reg.error);
        }
      }
      if (added.length) onChange([...items, ...added]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-input",
        )}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Drag &amp; drop, or{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => inputRef.current?.click()}
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Images and video · up to {MEDIA_LIMITS.maxPerPost} files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={[
            ...MEDIA_LIMITS.acceptedImageTypes,
            ...MEDIA_LIMITS.acceptedVideoTypes,
          ].join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              {item.mimeType.startsWith("video/") ? (
                <video src={item.url} className="size-full object-cover" muted />
              ) : (
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-x-0 top-0 flex justify-between p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  className="rounded bg-black/60 p-0.5 text-white"
                  aria-label="Move earlier"
                >
                  <GripVertical className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded bg-black/60 p-0.5 text-white"
                  aria-label="Remove"
                >
                  <X className="size-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function imageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject();
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
