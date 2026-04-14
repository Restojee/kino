import { Component, resolveNode } from "./Component";

export const Events = {
  click: "click",
  submit: "submit",
  input: "input",
  change: "change",
  focus: "focus",
  blur: "blur",
  keydown: "keydown",
  keyup: "keyup",
  mouseenter: "mouseenter",
  mouseleave: "mouseleave",
  scroll: "scroll",
  resize: "resize",
} as const;

export type EventType = (typeof Events)[keyof typeof Events];

export const Elements = {
  div: "div",
  span: "span",
  p: "p",
  strong: "strong",
  em: "em",
  article: "article",
  section: "section",
  header: "header",
  footer: "footer",
  main: "main",
  nav: "nav",
  ul: "ul",
  li: "li",
  form: "form",
  label: "label",
  button: "button",
  input: "input",
  textarea: "textarea",
  select: "select",
  option: "option",
  img: "img",
  a: "a",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
} as const;

export type ElementTag = (typeof Elements)[keyof typeof Elements];

type Child =
  | Component
  | HTMLElement
  | Text
  | string
  | number
  | null
  | false
  | undefined;

type Attrs = Record<string, unknown>;

export function $<K extends ElementTag>(
  tag: K,
  attrs?: Attrs,
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag) as HTMLElementTagNameMap[K];

  for (const [key, val] of Object.entries(attrs ?? {})) {
    if (val === undefined || val === null) continue;

    if (key === "class") {
      el.className = val as string;
    } else if (key === "style") {
      Object.assign(el.style, val as Record<string, string>);
    } else if (key.startsWith("on")) {
      el.addEventListener(key.slice(2).toLowerCase(), val as EventListener);
    } else {
      el.setAttribute(key, String(val));
    }
  }

  for (const child of children.flat()) {
    if (child === null || child === false || child === undefined) continue;

    if (child instanceof Component) {
      el.appendChild(resolveNode(child));
    } else if (typeof child === "string" || typeof child === "number") {
      el.appendChild(document.createTextNode(String(child)));
    } else {
      el.appendChild(child);
    }
  }

  return el;
}

export function $text(content: string | number): Text {
  return document.createTextNode(String(content));
}

export function $clear(el: HTMLElement): void {
  el.replaceChildren();
}

export function $append(
  parent: HTMLElement,
  ...children: (Child | Child[])[]
): void {
  for (const child of children.flat()) {
    if (child === null || child === false || child === undefined) continue;
    if (child instanceof Component) {
      parent.appendChild(resolveNode(child));
    } else if (typeof child === "string" || typeof child === "number") {
      parent.appendChild(document.createTextNode(String(child)));
    } else {
      parent.appendChild(child);
    }
  }
}

export function $replace(
  parent: HTMLElement,
  ...children: (Child | Child[])[]
): void {
  parent.replaceChildren();
  $append(parent, ...children);
}

export function $html(el: HTMLElement, html: string): void {
  el.innerHTML = html;
}

export function addEvent<K extends EventType>(
  el: HTMLElement,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
): HTMLElement {
  el.addEventListener(event, handler as EventListener);
  return el;
}
