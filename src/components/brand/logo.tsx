import { cn } from "@/lib/utils";

/** PostPilot mark — a paper plane on an orbit path. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-7", className)}
      aria-hidden="true"
    >
      <path
        d="M4 16.5C4 9.6 9.6 4 16.5 4c4.9 0 9.1 2.8 11.2 6.9"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 6 6 14.4c-1 .4-1 1.8 0 2.2l8.3 3 3 8.3c.4 1 1.8 1 2.2 0L28 6Z"
        fill="currentColor"
      />
      <path
        d="M28 6 14.3 19.6"
        stroke="var(--color-background)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="text-primary" />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">PostPilot</span>
      )}
    </span>
  );
}
