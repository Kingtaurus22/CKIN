/**
 * Penerjemah tampilan ID → EN.
 *
 * Seluruh teks UI CKIN ditulis dalam Bahasa Indonesia. Saat bahasa diganti ke
 * English, translator ini menelusuri DOM dan mengganti teks yang ada di kamus
 * (src/i18n/en.ts) — termasuk placeholder, aria-label, title, dan alt.
 * MutationObserver menjaga teks yang dirender ulang React tetap terjemahan.
 *
 * Konten buatan pengguna (chat, catatan, nama) tidak ikut diterjemahkan
 * karena tidak ada di kamus, atau ditandai `data-no-translate`.
 */
import { EN, EN_PATTERNS } from "./en";

const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "NOSCRIPT"]);

type Entry = { original: string; output: string };
const textState = new WeakMap<Text, Entry>();
const attrState = new WeakMap<Element, Map<string, Entry>>();

let observer: MutationObserver | null = null;
let active = false;

/** Terjemahkan satu string (tanpa spasi tepi). Mengembalikan null bila tidak dikenal. */
export function translate(source: string): string | null {
  const key = source.replace(/\s+/g, " ").trim();
  if (!key) return null;
  const direct = EN[key];
  if (direct !== undefined) return direct;
  for (const [pattern, replace] of EN_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(key)) {
      pattern.lastIndex = 0;
      const out = key.replace(pattern, replace as never);
      if (out !== key) return out;
    }
  }
  return null;
}

/** Elemen yang seluruh isinya tidak diterjemahkan (konten pengguna, script). */
function skipped(el: Element | null) {
  return !!el?.closest?.("[data-no-translate]") || (el ? el.tagName === "SCRIPT" || el.tagName === "STYLE" : false);
}

function translateText(node: Text) {
  const value = node.nodeValue ?? "";
  const state = textState.get(node);
  if (state && value === state.output) return; // sudah diterjemahkan
  const original = value;
  const parent = node.parentElement;
  if (!/[A-Za-z]/.test(original) || skipped(parent) || (parent && SKIP_TAGS.has(parent.tagName))) return;
  const out = translate(original);
  if (out === null) {
    textState.delete(node);
    return;
  }
  const lead = original.match(/^\s*/)?.[0] ?? "";
  const trail = original.match(/\s*$/)?.[0] ?? "";
  const output = lead + out + trail;
  textState.set(node, { original, output });
  node.nodeValue = output;
}

function translateAttrs(el: Element) {
  if (el.closest("[data-no-translate]")) return;
  for (const name of ATTRS) {
    const value = el.getAttribute(name);
    if (!value) continue;
    let map = attrState.get(el);
    const prev = map?.get(name);
    if (prev && prev.output === value) continue;
    const out = translate(value);
    if (out === null) continue;
    if (!map) {
      map = new Map();
      attrState.set(el, map);
    }
    map.set(name, { original: value, output: out });
    el.setAttribute(name, out);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    const el = root as Element;
    if (skipped(el)) return;
    translateAttrs(el);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE && skipped(node as Element)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
    else translateAttrs(node as Element);
    node = walker.nextNode();
  }
}

/** Kembalikan semua teks yang sudah diterjemahkan ke Bahasa Indonesia. */
function restore(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node as Text;
      const st = textState.get(t);
      if (st && t.nodeValue === st.output) t.nodeValue = st.original;
      textState.delete(t);
    } else {
      const el = node as Element;
      const map = attrState.get(el);
      map?.forEach((st, name) => {
        if (el.getAttribute(name) === st.output) el.setAttribute(name, st.original);
      });
      attrState.delete(el);
    }
    node = walker.nextNode();
  }
}

let titleOriginal: string | null = null;
let titleOutput: string | null = null;
function translateTitle() {
  const current = document.title;
  if (!current || current === titleOutput) return;
  titleOriginal = current;
  titleOutput = current
    .split(" · ")
    .map((part) => translate(part) ?? part)
    .join(" · ");
  document.title = titleOutput;
}

export function startTranslator() {
  if (active || typeof document === "undefined") return;
  active = true;
  walk(document.body);
  translateTitle();
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "characterData") translateText(m.target as Text);
      else if (m.type === "attributes") translateAttrs(m.target as Element);
      else m.addedNodes.forEach((n) => walk(n));
    }
    translateTitle();
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });
  document.documentElement.classList.remove("i18n-pending");
}

export function stopTranslator() {
  if (!active) return;
  active = false;
  observer?.disconnect();
  observer = null;
  restore(document.body);
  if (titleOriginal && document.title === titleOutput) document.title = titleOriginal;
  titleOriginal = null;
  titleOutput = null;
}
