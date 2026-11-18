// Browser-side helper for calling our own API routes with consistent errors.
import type { FieldErrors } from "./types";

export class ApiError extends Error {
  status: number;
  fieldErrors?: FieldErrors;

  constructor(message: string, status: number, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    if (init?.signal?.aborted) throw err;
    throw new ApiError("Couldn't reach the server. Check your connection and try again.", 0);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const b = (body ?? {}) as { error?: string; fieldErrors?: FieldErrors };
    throw new ApiError(b.error ?? `Request failed (${response.status}).`, response.status, b.fieldErrors);
  }
  return body as T;
}

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
