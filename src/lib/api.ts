import { NextResponse } from "next/server";

export const ITEM_DESCRIPTION_MAX_LENGTH = 200;

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
