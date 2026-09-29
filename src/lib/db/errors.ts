export class DatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Service temporarily unavailable.");
    this.name = "DatabaseUnavailableError";
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

export function wrapDatabaseError(error: unknown): DatabaseUnavailableError {
  if (error instanceof DatabaseUnavailableError) return error;
  return new DatabaseUnavailableError(error);
}
