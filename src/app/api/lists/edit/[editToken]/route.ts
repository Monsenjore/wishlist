import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isNonEmptyString, jsonError, parseJsonBody } from "@/lib/api";

const LIST_SELECT = {
  id: true,
  title: true,
  eventDate: true,
  description: true,
  editToken: true,
  viewToken: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: { position: "asc" as const },
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ editToken: string }> },
) {
  const { editToken } = await params;

  const list = await prisma.list.findUnique({
    where: { editToken },
    select: LIST_SELECT,
  });
  if (!list) return jsonError(404, "Not found");

  return NextResponse.json(list);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ editToken: string }> },
) {
  const { editToken } = await params;

  const list = await prisma.list.findUnique({ where: { editToken }, select: { id: true } });
  if (!list) return jsonError(404, "Not found");

  const body = await parseJsonBody(request);
  if (!body) return jsonError(400, "Invalid request body");

  const { title, eventDate, description } = body;
  const data: { title?: string; eventDate?: Date | null; description?: string | null } = {};

  if (title !== undefined) {
    if (!isNonEmptyString(title)) return jsonError(400, "Title is required");
    data.title = title.trim();
  }
  if (eventDate !== undefined) {
    data.eventDate = typeof eventDate === "string" && eventDate ? new Date(eventDate) : null;
  }
  if (description !== undefined) {
    data.description = typeof description === "string" && description.trim() ? description.trim() : null;
  }

  const updated = await prisma.list.update({
    where: { editToken },
    data,
    select: LIST_SELECT,
  });

  return NextResponse.json(updated);
}
