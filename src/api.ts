const API = "https://dog.ceo/api";

interface ApiResponse<T> {
  message: T;
  status: string;
}

export interface Breed {
  /** API path, e.g. "retriever/golden" or "beagle". Also used as a unique id. */
  id: string;
  /** Human readable name, e.g. "Golden retriever". */
  name: string;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const body = (await res.json()) as ApiResponse<T>;
  if (body.status !== "success") throw new Error("The service returned an error.");
  return body.message;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function toName(breed: string, sub?: string): string {
  return sub ? `${capitalize(sub)} ${breed}` : capitalize(breed);
}

/** Fetch every breed and flatten sub-breeds into a single sorted list. */
export async function fetchBreeds(): Promise<Breed[]> {
  const data = await getJSON<Record<string, string[]>>(`${API}/breeds/list/all`);
  const breeds: Breed[] = [];

  for (const [breed, subs] of Object.entries(data)) {
    if (subs.length === 0) {
      breeds.push({ id: breed, name: toName(breed) });
    } else {
      for (const sub of subs) {
        breeds.push({ id: `${breed}/${sub}`, name: toName(breed, sub) });
      }
    }
  }

  return breeds.sort((a, b) => a.name.localeCompare(b.name));
}
export function fetchPhotos(breedId: string, count = 6): Promise<string[]> {
  return getJSON<string[]>(`${API}/breed/${breedId}/images/random/${count}`);
}