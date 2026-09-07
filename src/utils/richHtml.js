import Prism from "prismjs";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-c.js";
import "prismjs/components/prism-cpp.js";
import "prismjs/components/prism-csharp.js";
import "prismjs/components/prism-go.js";
import "prismjs/components/prism-java.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-kotlin.js";
import "prismjs/components/prism-lua.js";
import "prismjs/components/prism-markdown.js";
import "prismjs/components/prism-markup-templating.js";
import "prismjs/components/prism-php.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-r.js";
import "prismjs/components/prism-ruby.js";
import "prismjs/components/prism-rust.js";
import "prismjs/components/prism-sql.js";
import "prismjs/components/prism-swift.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-visual-basic.js";
import "prismjs/components/prism-yaml.js";
import "prismjs/components/prism-groovy.js";
import "prismjs/components/prism-jsx.js";

Prism.manual = true;

const LANGUAGE_ALIASES = Object.freeze({
  csharp: "csharp",
  cs: "csharp",
  cplusplus: "cpp",
  "c++": "cpp",
  html: "markup",
  js: "javascript",
  json5: "json",
  kt: "kotlin",
  md: "markdown",
  py: "python",
  rb: "ruby",
  rs: "rust",
  shell: "bash",
  sh: "bash",
  ts: "typescript",
  txt: "plain",
  text: "plain",
  xml: "markup",
  yml: "yaml",
});

export function safeCodeLanguage(value) {
  const language = String(value || "").trim().toLowerCase();
  return /^[a-z0-9_+#-]{1,32}$/.test(language) ? language : "";
}

export function normalizeCodeLanguage(value) {
  const language = safeCodeLanguage(value);
  return LANGUAGE_ALIASES[language] || language;
}

function codeLanguageFromElement(code) {
  const dataLanguage = code.getAttribute("data-code-language");
  const classLanguage = [...code.classList]
    .find((className) => className.startsWith("language-"))
    ?.slice("language-".length);
  const source = safeCodeLanguage(dataLanguage || classLanguage);
  return {
    source,
    normalized: normalizeCodeLanguage(source),
  };
}

function highlightCodeElements(documentNode) {
  documentNode.body.querySelectorAll("pre > code").forEach((code) => {
    const { source, normalized } = codeLanguageFromElement(code);
    if (!source || !normalized) return;

    code.className = `language-${normalized}`;
    code.setAttribute("data-code-language", source);
    const pre = code.parentElement;
    pre?.setAttribute("data-code-language", source);
    pre?.setAttribute("tabindex", "0");

    const grammar = Prism.languages[normalized];
    if (!grammar || normalized === "plain") return;
    code.innerHTML = Prism.highlight(code.textContent || "", grammar, normalized);
  });
}

function wrapTables(documentNode) {
  documentNode.body.querySelectorAll("table").forEach((table) => {
    if (table.closest("[data-life-post-card]")) return;
    if (table.parentElement?.classList.contains("markdown-table-scroll")) return;
    const wrapper = documentNode.createElement("div");
    wrapper.className = "markdown-table-scroll";
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute("aria-label", "可横向滚动的数据表格");
    wrapper.setAttribute("tabindex", "0");
    table.replaceWith(wrapper);
    wrapper.append(table);
  });
}

/**
 * This runs only after stored/imported HTML has been sanitized. Prism receives
 * textContent and emits escaped, static spans; no user HTML is reintroduced.
 */
export function decorateRichHtml(rawHtml) {
  const html = String(rawHtml || "");
  if (typeof DOMParser === "undefined") return html;
  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  highlightCodeElements(parsed);
  wrapTables(parsed);
  return parsed.body.innerHTML;
}

export function highlightCodeText(source, language) {
  const normalized = normalizeCodeLanguage(language);
  const grammar = Prism.languages[normalized];
  if (!normalized || !grammar || normalized === "plain") return "";
  return Prism.highlight(String(source || ""), grammar, normalized);
}
