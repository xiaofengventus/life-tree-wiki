import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";
import { mathSourceHtml } from "./micromarkMathSourceHtml";
import { normalizeLatexDelimiters, upgradeTextLatex } from "./latexScan.js";
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

/**
 * 把**文字层**里手写的 LaTeX 升级成公式节点。
 *
 * ⚠️ 这一步必须有，否则「预览」和「插入正文」会分叉成两套结果：
 *
 *     预览  → decorateRichHtml(renderFormulaNodes(markdownToSafeHtml(src)))
 *     插入  → markdownToSafeHtml(src)
 *
 * `renderFormulaNodes` 里含 upgradeTextLatex，而插入这条路原来没有 ——
 * 同一份 Markdown，预览里公式渲染正常，插进编辑器却是一串裸文本。
 * 用户看到的正是「导入后在预览是对的、到编辑器就不一样了」。
 *
 * 放在 sanitize **之前**：新建出来的公式节点正好由 sanitize 统一校验（safeFormula），
 * 不用另开一条安全的旁路。
 */
function upgradeLatexNodes(rawHtml) {
  if (typeof DOMParser === "undefined") return rawHtml;
  const parsed = new DOMParser().parseFromString(`<body>${rawHtml || ""}</body>`, "text/html");
  upgradeTextLatex(parsed);
  return parsed.body.innerHTML;
}

export function markdownSyntaxToHtml(markdown) {
  const source = String(markdown || "");
  if (source.length > MAX_MARKDOWN_LENGTH) {
    throw new Error("Markdown 内容不能超过 50 万个字符");
  }
  // 先归一化 LaTeX 风格定界符：CommonMark 会把 `\(` `\[` 当反斜杠转义吃掉，
  // 导致 `\(a=1\)` 变成 `(a=1)` —— 公式源码直接损坏。归一成 `$` 系再交给 micromark。
  return micromark(normalizeLatexDelimiters(source), {
    allowDangerousHtml: false,
    allowDangerousProtocol: false,
    extensions: [gfm(), math()],
    htmlExtensions: [gfmHtml(), mathSourceHtml()],
  });
}

export function markdownToSafeHtml(markdown) {
  return wrapMarkdownImages(
    sanitizeHtml(upgradeLatexNodes(normalizeTaskLists(markdownSyntaxToHtml(markdown)))),
  );
}
