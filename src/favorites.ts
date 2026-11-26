const KEY = "pet-directory:favorites";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (private mode); favorites then last for the session only.
  }
}

let current = new Set(read());

export const isFavorite = (id: string): boolean => current.has(id);

/** Toggle a breed and return its new saved state. */
export function toggleFavorite(id: string): boolean {
  if (current.has(id)) current.delete(id);
  else current.add(id);
  write([...current]);
  return current.has(id);
}