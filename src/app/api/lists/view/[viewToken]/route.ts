import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ viewToken: string }> },
) {
  const { viewToken } = await params;

  const list = await prisma.list.findUnique({
    where: { viewToken },
    select: {
      id: true,
      title: true,
      eventDate: true,
      description: true,
      createdAt: true,
      items: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          position: true,
        },
      },
    },
  });
  if (!list) return jsonError(404, "Not found");

  return NextResponse.json(list);
}
