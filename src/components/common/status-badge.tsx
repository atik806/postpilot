import { Badge } from "@/components/ui/badge";
import type {
  PostStatus,
  PostTargetStatus,
  SocialAccountStatus,
} from "@/types";

const POST: Record<
  PostStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "muted" }
> = {
  DRAFT: { label: "Draft", variant: "muted" },
  SCHEDULED: { label: "Scheduled", variant: "default" },
  PUBLISHING: { label: "Publishing", variant: "warning" },
  PUBLISHED: { label: "Published", variant: "success" },
  PARTIALLY_PUBLISHED: { label: "Partially published", variant: "warning" },
  FAILED: { label: "Failed", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "muted" },
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const s = POST[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

const TARGET: Record<PostTargetStatus, { label: string; variant: "muted" | "warning" | "success" | "destructive" }> = {
  PENDING: { label: "Waiting", variant: "muted" },
  PUBLISHING: { label: "Publishing", variant: "warning" },
  PUBLISHED: { label: "Published", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "muted" },
};

export function TargetStatusBadge({ status }: { status: PostTargetStatus }) {
  const s = TARGET[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

const ACCOUNT: Record<SocialAccountStatus, { label: string; variant: "success" | "warning" | "destructive" | "muted" }> = {
  CONNECTED: { label: "Connected", variant: "success" },
  EXPIRED: { label: "Expired", variant: "warning" },
  REAUTH_REQUIRED: { label: "Reconnect needed", variant: "warning" },
  DISCONNECTED: { label: "Disconnected", variant: "muted" },
  ERROR: { label: "Error", variant: "destructive" },
};

export function AccountStatusBadge({ status }: { status: SocialAccountStatus }) {
  const s = ACCOUNT[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
