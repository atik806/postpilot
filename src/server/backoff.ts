import { PUBLISHING } from "@/lib/constants";

/** Exponential backoff (seconds) for a given attempt number, capped. */
export function backoffSeconds(attempt: number): number {
  const raw = PUBLISHING.backoffBaseSeconds * 2 ** Math.max(0, attempt - 1);
  return Math.min(raw, PUBLISHING.backoffMaxSeconds);
}
