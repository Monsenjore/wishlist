"use client";

import { useEffect, useState } from "react";
import { InlineEditableField } from "@/components/InlineEditableField";
import { ShareButtonGroup } from "@/components/ShareButtonGroup";
import { saveListRef } from "@/lib/localLists";
import { hostnameFromUrl } from "@/lib/url";
import type { EditListDTO, ItemDTO } from "@/lib/types";

async function expectOk(res: Response) {
  if (!res.ok) throw new Error("Request failed");
}

export function EditListClient({ list: initialList }: { list: EditListDTO }) {
  const { editToken, viewToken, createdAt } = initialList;

  const [title, setTitle] = useState(initialList.title);
  const [eventDate, setEventDate] = useState(initialList.eventDate);
  const [description, setDescription] = useState(initialList.description ?? "");
  const [items, setItems] = useState<ItemDTO[]>(initialList.items);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState(`/list/${viewToken}`);

  useEffect(() => {
    setViewUrl(`${window.location.origin}/list/${viewToken}`);
    saveListRef({ editToken, viewToken, title: initialList.title, createdAt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patchList(data: Record<string, unknown>) {
    const res = await fetch(`/api/lists/edit/${editToken}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await expectOk(res);
  }

  async function saveTitle(value: string) {
    await patchList({ title: value });
    setTitle(value);
    saveListRef({ editToken, viewToken, title: value, createdAt });
  }

  async function saveDescription(value: string) {
    await patchList({ description: value });
    setDescription(value);
  }

  async function handleDateChange(value: string) {
    const previous = eventDate;
    setEventDate(value || null);
    try {
      await patchList({ eventDate: value || null });
    } catch {
      setEventDate(previous);
    }
  }

  async function patchItem(itemId: string, data: Record<string, unknown>): Promise<ItemDTO> {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, editToken }),
    });
    await expectOk(res);
    return res.json();
  }

  async function deleteItem(itemId: string) {
    const res = await fetch(`/api/items/${itemId}?editToken=${encodeURIComponent(editToken)}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  async function submitNewItem() {
    if (!newItemTitle.trim()) {
      setAddingItem(false);
      return;
    }

    setAddError(null);
    try {
      const res = await fetch(`/api/lists/edit/${editToken}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newItemTitle.trim() }),
      });
      await expectOk(res);
      const item: ItemDTO = await res.json();
      setItems((prev) => [...prev, item]);
      setNewItemTitle("");
      setAddingItem(false);
    } catch {
      setAddError("Couldn't add item — try again");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 pt-12">
      <div className="w-full max-w-[680px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.22px] text-fog">Edit mode</p>

        <div className="mt-3">
          <InlineEditableField
            value={title}
            onSave={saveTitle}
            required
            className="font-heading text-[32px] text-ink"
            ariaLabel="List title"
          />
        </div>

        <div className="mt-2">
          <input
            type="date"
            value={eventDate ? eventDate.slice(0, 10) : ""}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-card border border-mist px-2 py-1 text-sm text-slate outline-none focus:border-2 focus:border-iris"
          />
        </div>

        <div className="mt-4">
          <InlineEditableField
            value={description}
            onSave={saveDescription}
            as="textarea"
            placeholder="Add a description"
            className="text-base text-slate"
            ariaLabel="List description"
          />
        </div>

        <div className="mt-10 border-t border-mist pt-8">
          {items.length === 0 ? (
            <p className="text-center text-sm text-fog">No gifts yet — add the first one.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-card border border-mist p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <InlineEditableField
                        value={item.title}
                        onSave={async (value) => {
                          const updated = await patchItem(item.id, { title: value });
                          setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
                        }}
                        required
                        className="text-base font-medium text-ink"
                        ariaLabel="Item title"
                      />
                      <div className="mt-1">
                        <InlineEditableField
                          value={item.description ?? ""}
                          onSave={async (value) => {
                            const updated = await patchItem(item.id, { description: value });
                            setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
                          }}
                          as="textarea"
                          placeholder="Add a description"
                          maxLength={200}
                          counterThreshold={160}
                          className="text-sm text-slate"
                          ariaLabel="Item description"
                        />
                      </div>
                      <div className="mt-1">
                        <InlineEditableField
                          value={item.url ?? ""}
                          onSave={async (value) => {
                            const updated = await patchItem(item.id, { url: value });
                            setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
                          }}
                          placeholder="Add a link"
                          className="text-sm text-iris"
                          ariaLabel="Item link"
                          renderValue={(value) => (
                            <span className="inline-flex max-w-full items-center gap-1 text-iris">
                              🔗 <span className="truncate">{hostnameFromUrl(value)}</span>
                            </span>
                          )}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      aria-label="Delete item"
                      className="shrink-0 text-fog transition-colors hover:text-signal"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {addingItem ? (
            <div className="mt-4 flex flex-col gap-2">
              <input
                autoFocus
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onBlur={submitNewItem}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Item title"
                className="rounded-card border border-iris px-3 py-2 text-base text-ink outline-none"
              />
              {addError && <p className="text-xs text-signal">{addError}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingItem(true)}
              className="mt-4 w-full rounded-card border border-mist py-2.5 text-sm font-medium uppercase text-ink transition-colors hover:border-iris"
            >
              + Add item
            </button>
          )}
        </div>

        <div className="mt-10 rounded-card bg-snow p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22px] text-fog">Share</p>
          <p className="mt-2 truncate text-sm text-[#333333]">{viewUrl}</p>
          <div className="mt-4">
            <ShareButtonGroup title={title} viewUrl={viewUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
