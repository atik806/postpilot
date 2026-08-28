/**
 * Minimal structured logger. In production this would forward to a log sink;
 * here it emits single-line JSON so publishing attempts stay traceable
 * (spec §24 Observability).
 */

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    emit("error", msg, meta),
  child: (base: Record<string, unknown>) => ({
    debug: (msg: string, meta?: Record<string, unknown>) =>
      emit("debug", msg, { ...base, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>) =>
      emit("info", msg, { ...base, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      emit("warn", msg, { ...base, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) =>
      emit("error", msg, { ...base, ...meta }),
  }),
};
