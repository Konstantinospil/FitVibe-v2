type ConsoleMethod = "log" | "warn" | "error";

const LEVEL_PREFIX: Record<ConsoleMethod, string> = {
  log: "[INFO]",
  warn: "[WARN]",
  error: "[ERROR]",
};

const serialize = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === undefined ||
    value === null
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[Unserializable]";
  }
};

const emit = (method: ConsoleMethod, values: unknown[]): void => {
  const serialized = values.map(serialize);
  console[method](LEVEL_PREFIX[method], ...serialized);
};

export const logger = {
  info: (...values: unknown[]): void => emit("log", values),
  warn: (...values: unknown[]): void => emit("warn", values),
  error: (...values: unknown[]): void => emit("error", values),
};
