export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createHttpError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): HttpError {
  return new HttpError(status, code, message, details);
}
