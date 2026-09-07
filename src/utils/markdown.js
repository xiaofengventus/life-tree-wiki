import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";
import { mathSourceHtml } from "./micromarkMathSourceHtml";
import { sanitizeHtml } from "./sanitizeHtml";

const MAX_MARKDOWN_LENGTH = 500_000;

function wrapMarkdownImages(rawHtml) {
  if (typeof DOMParser === "undefined") return rawHtml;
  const parsed = new DOMParser().parseFromString(`<body>${rawHtml || ""}</body>`, "text/html");

  while (true) {
    const image = [...parsed.body.querySelectorAll("img")]
      .find((candidate) => !candidate.closest("figure"));
    if (!image) break;

    const caption = String(image.getAttribute("alt") || "图片").trim().slice(0, 200) || "图片";
    const figure = parsed.createElement("figure");
    const figcaption = parsed.createElement("figcaption");
    figcaption.textContent = caption;
    const paragraph = image.closest("p");

    if (paragraph) {
      let unit = image;
      while (unit.parentElement && unit.parentElement !== paragraph) unit = unit.parentElement;
      const before = paragraph.cloneNode(false);
      const after = paragraph.cloneNode(false);
      let reachedImage = false;
      for (const child of Array.from(paragraph.childNodes)) {
        if (child === unit) {
          reachedImage = true;
          continue;
        }
        (reachedImage ? after : before).append(child);
      }
      figure.append(image, figcaption);
      paragraph.replaceWith(
        ...(before.textContent?.trim() || before.children.length ? [before] : []),
        figure,
        ...(after.textContent?.trim() || after.children.length ? [after] : []),
      );
    } else {
      image.replaceWith(figure);
      figure.append(image, figcaption);
    }
  }
  return parsed.body.innerHTML;
}

function normalizeTaskLists(rawHtml) {
  if (typeof DOMParser === "undefined") return rawHtml;
  const parsed = new DOMParser().parseFromString(`<body>${rawHtml || ""}</body>`, "text/html");

  parsed.body.querySelectorAll("ul").forEach((list) => {
    const items = [...list.children].filter((child) => child.tagName === "LI");
    const canUseEditorTodos =
      items.length > 0 &&
      items.every((item) =>
        [...item.children].some((child) => child.matches('input[type="checkbox"]')) &&
        ![...item.children].some((child) => child.tagName === "UL" || child.tagName === "OL"));
    if (!canUseEditorTodos) return;

    const fragment = parsed.createDocumentFragment();
    items.forEach((item) => {
      const checkbox = [...item.children]
        .find((child) => child.matches('input[type="checkbox"]'));
      const todo = parsed.createElement("div");
      todo.setAttribute("data-w-e-type", "todo");
      if (checkbox) todo.append(checkbox);
      while (item.firstChild) todo.append(item.firstChild);
      fragment.append(todo);
    });
    list.replaceWith(fragment);
  });

  return parsed.body.innerHTML;
}

export function markdownSyntaxToHtml(markdown) {
  const source = String(markdown || "");
  if (source.length > MAX_MARKDOWN_LENGTH) {
    throw new Error("Markdown 内容不能超过 50 万个字符");
  }
  return micromark(source, {
    allowDangerousHtml: false,
    allowDangerousProtocol: false,
    extensions: [gfm(), math()],
    htmlExtensions: [gfmHtml(), mathSourceHtml()],
  });
}

export function markdownToSafeHtml(markdown) {
  return wrapMarkdownImages(sanitizeHtml(normalizeTaskLists(markdownSyntaxToHtml(markdown))));
}
