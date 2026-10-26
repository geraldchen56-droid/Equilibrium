// Tiny DOM helper: h("div", { class: "x", onclick: fn }, child, "text")

type Attrs = Record<string, unknown> | null;
type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v as EventListener);
      else if (k === "html") el.innerHTML = String(v);
      else if (k === "dataset") Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? "" : String(v));
    }
  }
  append(el, children);
  return el;
}

export function append(el: Node, children: Child[]) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
  }
}

const SVGNS = "http://www.w3.org/2000/svg";
export function s(tag: string, attrs: Record<string, string | number> = {}, ...children: (Node | string)[]): SVGElement {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of children) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return el;
}

export const clear = (el: Element) => { while (el.firstChild) el.removeChild(el.firstChild); };

/** Paragraph shown only at a given depth or deeper. */
export const depth = (level: "formal" | "quant", ...children: Child[]) =>
  h("div", { class: `depth depth-${level}` }, h("span", { class: "depth-tag" }, level === "formal" ? "Formal" : "Quant"), ...children);

export const store = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};
