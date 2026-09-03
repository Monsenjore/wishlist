import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { isNonEmptyString, jsonError, parseJsonBody } from "@/lib/api";

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  if (!body) return jsonError(400, "Invalid request body");

  const { title, eventDate, description } = body;
  if (!isNonEmptyString(title)) return jsonError(400, "Title is required");

  const list = await prisma.list.create({
    data: {
      title: title.trim(),
      eventDate: typeof eventDate === "string" && eventDate ? new Date(eventDate) : null,
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      editToken: generateToken(),
      viewToken: generateToken(),
    },
    select: {
      id: true,
      title: true,
      eventDate: true,
      description: true,
      editToken: true,
      viewToken: true,
      createdAt: true,
    },
  });

  return NextResponse.json(list, { status: 201 });
}
