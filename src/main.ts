import "./style.css";
import { fetchBreeds, fetchPhotos, type Breed } from "./api.ts";
import { isFavorite, toggleFavorite } from "./favorites.ts";

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const countText = $<HTMLParagraphElement>("count");
const listError = $<HTMLParagraphElement>("list-error");
const listEl = $<HTMLUListElement>("breed-list");
const searchInput = $<HTMLInputElement>("search");
const favoritesOnly = $<HTMLInputElement>("favorites-only");

let breeds: Breed[] = [];

const detailBody = $<HTMLDivElement>("detail-body");
let selectedId: string | null = null;
const detail = $<HTMLElement>("detail");
let requestToken = 0;


function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function visibleBreeds(): Breed[] {
  const query = searchInput.value.trim().toLowerCase();
  return breeds.filter((b) => {
    if (favoritesOnly.checked && !isFavorite(b.id)) return false;
    return query === "" || b.name.toLowerCase().includes(query);
  });
}

function renderList(): void {
  const items = visibleBreeds();
  listEl.replaceChildren();

  for (const breed of items) {
    const li = el("li");
    const button = el("button", "breed-button", breed.name);
    button.type = "button";
    button.setAttribute("aria-pressed", String(breed.id === selectedId));
    if (isFavorite(breed.id)) {
      const badge = el("span", "badge", "Saved");
      button.append(badge);
    }
    button.addEventListener("click", () => void selectBreed(breed));
    li.append(button);
    listEl.append(li);
  }

  countText.textContent =
    items.length === 0
      ? favoritesOnly.checked
        ? "No saved breeds match your search."
        : "No breeds match your search."
      : `Showing ${items.length} of ${breeds.length} breeds.`;
}

function renderDetailShell(breed: Breed): { gallery: HTMLDivElement } {
  const title = el("h3", "breed-title", breed.name);

  const save = el("button", "secondary");
  save.type = "button";
  const syncSave = () => {
    const saved = isFavorite(breed.id);
    save.textContent = saved ? "Remove from saved" : "Save this breed";
    save.setAttribute("aria-pressed", String(saved));
  };
  syncSave();
  save.addEventListener("click", () => {
    toggleFavorite(breed.id);
    syncSave();
    renderList();
  });

  const refresh = el("button", "secondary", "Load different photographs");
  refresh.type = "button";
  refresh.addEventListener("click", () => void selectBreed(breed));

  const actions = el("div", "actions");
  actions.append(save, refresh);

  const gallery = el("div", "gallery");
  detailBody.replaceChildren(title, actions, gallery);
  return { gallery };
}

async function selectBreed(breed: Breed): Promise<void> {
  selectedId = breed.id;
  const token = ++requestToken;
  renderList();

  const { gallery } = renderDetailShell(breed);
  gallery.append(el("p", "meta", "Loading photographs…"));
  detail.focus({ preventScroll: false });

  try {
    const photos = await fetchPhotos(breed.id);
    if (token !== requestToken) return; // a newer selection superseded this one

    gallery.replaceChildren();
    for (const url of photos) {
      const figure = el("figure");
      const img = el("img");
      img.src = url;
      img.alt = `Photograph of a ${breed.name.toLowerCase()}`;
      img.loading = "lazy";
      figure.append(img);
      gallery.append(figure);
    }
  } catch (err) {
    if (token !== requestToken) return;
    const message = err instanceof Error ? err.message : "Unknown error";
    const notice = el("p", "notice error", `Photographs could not be loaded (${message}).`);
    notice.setAttribute("role", "alert");
    gallery.replaceChildren(notice);
  }
}

async function init(): Promise<void> {
  countText.textContent = "Loading breeds…";
  listError.hidden = true;

  try {
    breeds = await fetchBreeds();
    renderList();
  } catch (err) {
    countText.textContent = "";
    const message = err instanceof Error ? err.message : "Unknown error";
    listError.textContent = `The breed list could not be loaded (${message}). Check your connection and reload the page.`;
    listError.hidden = false;
  }
}

favoritesOnly.addEventListener("change", renderList);

searchInput.addEventListener("input", renderList);
void init();

