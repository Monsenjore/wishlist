import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ITEM_DESCRIPTION_MAX_LENGTH, isNonEmptyString, jsonError, parseJsonBody } from "@/lib/api";

async function findOwnedItem(itemId: string, editToken: unknown) {
  if (!isNonEmptyString(editToken)) return null;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { list: { select: { editToken: true } } },
  });
  if (!item || item.list.editToken !== editToken) return null;

  return item;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const body = await parseJsonBody(request);
  if (!body) return jsonError(400, "Invalid request body");

  const item = await findOwnedItem(itemId, body.editToken);
  if (!item) return jsonError(404, "Not found");

  const { title, description, url } = body;
  const data: { title?: string; description?: string | null; url?: string | null } = {};

  if (title !== undefined) {
    if (!isNonEmptyString(title)) return jsonError(400, "Title is required");
    data.title = title.trim();
  }
  if (description !== undefined) {
    if (typeof description === "string" && description.length > ITEM_DESCRIPTION_MAX_LENGTH) {
      return jsonError(400, `Description must be ${ITEM_DESCRIPTION_MAX_LENGTH} characters or fewer`);
    }
    data.description = typeof description === "string" && description.trim() ? description.trim() : null;
  }
  if (url !== undefined) {
    data.url = typeof url === "string" && url.trim() ? url.trim() : null;
  }

  const updated = await prisma.item.update({ where: { id: itemId }, data });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const { searchParams } = new URL(request.url);
  let editToken: unknown = searchParams.get("editToken");
  if (!editToken) {
    const body = await parseJsonBody(request);
    editToken = body?.editToken;
  }

  const item = await findOwnedItem(itemId, editToken);
  if (!item) return jsonError(404, "Not found");

  await prisma.item.delete({ where: { id: itemId } });

  return new NextResponse(null, { status: 204 });
}
