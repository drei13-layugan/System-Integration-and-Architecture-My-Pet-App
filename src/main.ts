import "./style.css";
import { fetchBreeds, type Breed } from "./api.ts";

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const countText = $<HTMLParagraphElement>("count");
const listError = $<HTMLParagraphElement>("list-error");
const listEl = $<HTMLUListElement>("breed-list");

let breeds: Breed[] = [];


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

function renderList(): void {
  listEl.replaceChildren();

  for (const breed of breeds) {
    const li = el("li");
    const button = el("button", "breed-button", breed.name);
    button.type = "button";
    li.append(button);
    listEl.append(li);
  }

  countText.textContent = `Showing ${breeds.length} of ${breeds.length} breeds.`;
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

void init();