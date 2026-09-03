"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSavedLists, saveListRef, type SavedListRef } from "@/lib/localLists";

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLists, setSavedLists] = useState<SavedListRef[]>([]);

  useEffect(() => {
    setSavedLists(getSavedLists());
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          eventDate: eventDate || undefined,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create list");

      const list = await res.json();
      saveListRef({
        editToken: list.editToken,
        viewToken: list.viewToken,
        title: list.title,
        createdAt: list.createdAt,
      });
      router.push(`/list/${list.editToken}/edit`);
    } catch {
      setError("Something went wrong — try again");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 pt-16">
      <div className="w-full max-w-[480px]">
        <h1 className="font-heading text-4xl text-ink">Create a wishlist</h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm text-slate">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Birthday wishlist"
              required
              className="rounded-card border border-mist px-3 py-3 text-base text-ink outline-none focus:border-2 focus:border-iris"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="eventDate" className="text-sm text-slate">
              Date
            </label>
            <input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="rounded-card border border-mist px-3 py-3 text-base text-ink outline-none focus:border-2 focus:border-iris"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm text-slate">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-card border border-mist px-3 py-3 text-base text-ink outline-none focus:border-2 focus:border-iris"
            />
          </div>

          {error && <p className="text-sm text-signal">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-card bg-iris px-5 py-3 font-sans text-sm font-medium uppercase text-white shadow-button transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Create list
          </button>
        </form>

        {savedLists.length > 0 && (
          <div className="mt-10 border-t border-mist pt-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.22px] text-fog">Your lists</p>
            <ul className="mt-4 flex flex-col gap-3">
              {savedLists.map((list) => (
                <li key={list.editToken}>
                  <a
                    href={`/list/${list.editToken}/edit`}
                    className="block rounded-card border border-mist px-4 py-3 transition-colors hover:border-iris"
                  >
                    <p className="text-ink">{list.title}</p>
                    <p className="mt-0.5 text-xs text-fog">
                      {new Date(list.createdAt).toLocaleDateString()}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
