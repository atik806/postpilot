import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { errors } from "@/lib/errors";
import { MEDIA_BUCKET, MEDIA_LIMITS } from "@/lib/constants";
import { assertRole, requireWorkspaceContext } from "@/server/session";

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  return map[mime] ?? "bin";
}

export function mediaKind(mime: string): "image" | "video" {
  return mime.startsWith("video/") ? "video" : "image";
}

export function validateMediaFile(mimeType: string, sizeBytes: number): void {
  const isImage = (MEDIA_LIMITS.acceptedImageTypes as readonly string[]).includes(
    mimeType,
  );
  const isVideo = (MEDIA_LIMITS.acceptedVideoTypes as readonly string[]).includes(
    mimeType,
  );
  if (!isImage && !isVideo) {
    throw errors.validation(`Unsupported file type: ${mimeType}`);
  }
  const max = isVideo ? MEDIA_LIMITS.maxVideoBytes : MEDIA_LIMITS.maxImageBytes;
  if (sizeBytes > max) {
    throw errors.validation(
      `File is too large. Max ${(max / (1024 * 1024)).toFixed(0)} MB for ${
        isVideo ? "videos" : "images"
      }.`,
    );
  }
}

export interface UploadTicket {
  path: string;
  token: string;
  bucket: string;
}

/** Step 1 — issue a direct-to-storage signed upload URL. */
export async function requestUpload(input: {
  mimeType: string;
  sizeBytes: number;
}): Promise<UploadTicket> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  validateMediaFile(input.mimeType, input.sizeBytes);

  const path = `${ctx.workspace.id}/${randomUUID()}.${extFromMime(input.mimeType)}`;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) throw errors.internal("Could not start the upload.");

  return { path: data.path, token: data.token, bucket: MEDIA_BUCKET };
}

/** Step 2 — after the client uploads, record the media row. */
export async function registerMedia(input: {
  path: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}): Promise<{ id: string; url: string }> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  if (!input.path.startsWith(`${ctx.workspace.id}/`)) {
    throw errors.forbidden("That upload path isn't in your workspace.");
  }
  validateMediaFile(input.mimeType, input.sizeBytes);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("media")
    .insert({
      workspace_id: ctx.workspace.id,
      uploaded_by: ctx.user.id,
      storage_path: input.path,
      storage_url: input.path,
      mime_type: input.mimeType,
      file_size: input.sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw errors.internal("Could not save the media.");

  const url = await signedUrl(input.path);
  return { id: data.id, url: url ?? "" };
}

export async function signedUrl(
  path: string,
  expiresIn = 60 * 60,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

/** Service-role signed URL — used by the publishing worker. */
export async function signedUrlAdmin(
  path: string,
  expiresIn = 60 * 30,
): Promise<string | null> {
  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
