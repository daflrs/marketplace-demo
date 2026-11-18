// Server-side helpers for consistent JSON responses from the API routes.
import { NextResponse } from "next/server";
import { ConfigError } from "./supabase";
import type { FieldErrors } from "./types";

export const NO_STORE = { "Cache-Control": "no-store" };

export function jsonError(status: number, error: string, fieldErrors?: FieldErrors) {
  return NextResponse.json(fieldErrors ? { error, fieldErrors } : { error }, { status, headers: NO_STORE });
}

/** Logs the real error, but only sends the browser a safe message. */
export function serverError(err: unknown, context: string) {
  console.error(`[api] ${context}:`, err);
  if (err instanceof ConfigError) return jsonError(500, err.message);

  const code = (err as { code?: string } | null)?.code;
  if (code === "23514" || code === "22P02" || code === "23502") {
    return jsonError(400, "Some of the details aren't valid. Please check them and try again.");
  }
  return jsonError(500, "Something went wrong on our side. Please try again.");
}

/** Parses a JSON object body, or returns null for anything else. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
