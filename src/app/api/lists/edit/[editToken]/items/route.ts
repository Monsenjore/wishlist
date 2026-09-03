import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ITEM_DESCRIPTION_MAX_LENGTH, isNonEmptyString, jsonError, parseJsonBody } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ editToken: string }> },
) {
  const { editToken } = await params;

  const list = await prisma.list.findUnique({ where: { editToken }, select: { id: true } });
  if (!list) return jsonError(404, "Not found");

  const body = await parseJsonBody(request);
  if (!body) return jsonError(400, "Invalid request body");

  const { title, description, url } = body;
  if (!isNonEmptyString(title)) return jsonError(400, "Title is required");
  if (typeof description === "string" && description.length > ITEM_DESCRIPTION_MAX_LENGTH) {
    return jsonError(400, `Description must be ${ITEM_DESCRIPTION_MAX_LENGTH} characters or fewer`);
  }

  const last = await prisma.item.findFirst({
    where: { listId: list.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const item = await prisma.item.create({
    data: {
      listId: list.id,
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      url: typeof url === "string" && url.trim() ? url.trim() : null,
      position: (last?.position ?? -1) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
