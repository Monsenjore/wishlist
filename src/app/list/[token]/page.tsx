import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hostnameFromUrl } from "@/lib/url";

export default async function ViewListPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const list = await prisma.list.findUnique({
    where: { viewToken: token },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!list) notFound();

  return (
    <div className="flex flex-1 flex-col items-center px-4 pt-16">
      <div className="w-full max-w-[680px]">
        <h1 className="font-heading text-[42px] text-ink">{list.title}</h1>

        {list.eventDate && (
          <span className="mt-3 inline-block rounded-pill border border-mist px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22px] text-slate">
            {list.eventDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        )}

        {list.description && <p className="mt-4 text-base text-slate">{list.description}</p>}

        <div className="mt-10 border-t border-mist pt-8">
          {list.items.length === 0 ? (
            <p className="text-center text-sm text-fog">This list doesn&apos;t have any items yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {list.items.map((item) => (
                <li key={item.id} className="rounded-card border border-mist p-4">
                  <p className="font-medium text-ink">{item.title}</p>
                  {item.description && <p className="mt-1 text-sm text-slate">{item.description}</p>}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 rounded-pill border border-mist px-3 py-1 text-xs uppercase text-ink transition-colors hover:border-iris"
                    >
                      {hostnameFromUrl(item.url)} ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
