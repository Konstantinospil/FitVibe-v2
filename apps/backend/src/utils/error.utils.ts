export function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  const message =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return new Error(message);
}

export function toErrorPayload(value: unknown): Record<string, unknown> {
  const err = toError(value);
  const payload: Record<string, unknown> = { err };
  if (!(value instanceof Error)) {
    payload.raw = value;
  }
  return payload;
}
