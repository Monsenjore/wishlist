import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditListClient } from "./EditListClient";

export default async function EditListPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const list = await prisma.list.findUnique({
    where: { editToken: token },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!list) notFound();

  return (
    <EditListClient
      list={{
        id: list.id,
        title: list.title,
        eventDate: list.eventDate ? list.eventDate.toISOString() : null,
        description: list.description,
        editToken: list.editToken,
        viewToken: list.viewToken,
        createdAt: list.createdAt.toISOString(),
        items: list.items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          url: item.url,
          position: item.position,
        })),
      }}
    />
  );
}
