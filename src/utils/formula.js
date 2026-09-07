import katex from "katex";
import "katex/dist/katex.min.css";
import "../assets/formula.css";

export const MAX_FORMULA_LENGTH = 4_000;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function cleanLatex(value) {
  return String(value || "").trim().slice(0, MAX_FORMULA_LENGTH);
}

export function renderLatex(latex, displayMode = false, { throwOnError = false } = {}) {
  const source = cleanLatex(latex);
  if (!source) return "";
  try {
    return katex.renderToString(source, {
      displayMode: Boolean(displayMode),
      throwOnError,
      trust: false,
      strict: "warn",
      output: "htmlAndMathml",
    });
  } catch (error) {
    if (throwOnError) throw error;
    return `<span class="life-math-error">${escapeHtml(source)}</span>`;
  }
}

export function renderFormulaNodes(rawHtml) {
  const html = String(rawHtml || "");
  if (typeof DOMParser === "undefined") return html;

  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  parsed.body.querySelectorAll("[data-life-math]").forEach((element) => {
    const mode = element.getAttribute("data-life-math");
    const latex = cleanLatex(element.getAttribute("data-latex") || element.textContent);
    const isBlock = mode === "block";
    const validElement =
      (mode === "inline" && element.tagName === "SPAN") ||
      (isBlock && (element.tagName === "DIV" || element.tagName === "P"));
    if (!validElement || !latex) {
      element.replaceWith(parsed.createTextNode(element.textContent || ""));
      return;
    }

    element.className = isBlock ? "life-math-block" : "life-math-inline";
    element.setAttribute("aria-label", `数学公式：${latex}`);
    element.innerHTML = renderLatex(latex, isBlock);
  });
  return parsed.body.innerHTML;
}
