export interface SavedListRef {
  editToken: string;
  viewToken: string;
  title: string;
  createdAt: string;
}

const STORAGE_KEY = "wishlist:lists";

export function getSavedLists(): SavedListRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveListRef(ref: SavedListRef) {
  if (typeof window === "undefined") return;
  try {
    const rest = getSavedLists().filter((l) => l.editToken !== ref.editToken);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([ref, ...rest]));
  } catch {
    // localStorage unavailable (private mode, quota) — this is convenience only, safe to skip
  }
}
