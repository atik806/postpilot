/**
 * Typed application errors. Route handlers convert these into safe JSON
 * responses via `toErrorResponse`. Raw provider/database errors must never
 * be forwarded to the client.
 */

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "PLAN_LIMIT"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "INTERNAL";

const STATUS: Record<AppErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  PLAN_LIMIT: 402,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PROVIDER_ERROR: 502,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;
  /** Optional UI hint, e.g. { action: "reconnect", platform: "instagram" }. */
  readonly hint?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message: string,
    opts: { details?: unknown; hint?: Record<string, unknown> } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
    this.details = opts.details;
    this.hint = opts.hint;
  }
}

export const errors = {
  unauthenticated: (m = "You need to sign in.") =>
    new AppError("UNAUTHENTICATED", m),
  forbidden: (m = "You don't have access to this.") =>
    new AppError("FORBIDDEN", m),
  notFound: (m = "Not found.") => new AppError("NOT_FOUND", m),
  validation: (m: string, details?: unknown) =>
    new AppError("VALIDATION", m, { details }),
  planLimit: (m: string, hint?: Record<string, unknown>) =>
    new AppError("PLAN_LIMIT", m, { hint }),
  conflict: (m: string) => new AppError("CONFLICT", m),
  provider: (m: string, hint?: Record<string, unknown>) =>
    new AppError("PROVIDER_ERROR", m, { hint }),
  internal: (m = "Something went wrong on our end.") =>
    new AppError("INTERNAL", m),
};

export function toErrorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json(
      { error: { code: err.code, message: err.message, hint: err.hint } },
      { status: err.status },
    );
  }
  // Unknown error — log server-side, return an opaque message.
  console.error("[unhandled]", err);
  return Response.json(
    { error: { code: "INTERNAL", message: "Something went wrong." } },
    { status: 500 },
  );
}
