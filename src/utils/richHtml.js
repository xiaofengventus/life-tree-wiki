import Prism from "prismjs";
import { CODE_SAMPLE_LANGUAGE, codeSampleHtml } from "./codeSample.js";
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

export const CODE_COPY_BUTTON_CLASS = "code-copy-button";

/**
 * 给每个代码块挂一个「复制」按钮。
 *
 * 按钮只存在于渲染结果里，不会进入编辑器正文、也不会入库
 * （服务端 DROP_WITH_CONTENT 本身就包含 button）。复制内容取
 * `pre > code` 的纯文本，因此按钮自身的文字不会被复制进去。
 */
function attachCodeCopyButtons(documentNode) {
  documentNode.body.querySelectorAll("pre").forEach((pre) => {
    if (pre.closest("[data-life-post-card]")) return;
    // 只认标准的 <pre><code> 代码块，避免给纯文本 pre 挂按钮
    if (!pre.querySelector(":scope > code")) return;
    if (pre.querySelector(`.${CODE_COPY_BUTTON_CLASS}`)) return;
    const button = documentNode.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("class", CODE_COPY_BUTTON_CLASS);
    button.setAttribute("aria-label", "复制代码");
    button.setAttribute("title", "复制代码");
    button.setAttribute("data-code-copy", "");
    button.textContent = "复制";
    pre.append(button);
  });
}

/**
 * 语言标记为 `sample` 的代码块，升级成 输入 / 输出 对照卡片。
 *
 * 必须跑在 attachCodeCopyButtons 之前 —— 卡片的两栏本身就是
 * `<pre><code>`，复制按钮会被下一步自动挂上，不用另写一套。
 */
function upgradeCodeSamples(documentNode) {
  let index = 0;
  documentNode.body.querySelectorAll("pre > code").forEach((code) => {
    if (codeLanguageFromElement(code).source !== CODE_SAMPLE_LANGUAGE) return;
    const pre = code.parentElement;
    if (!pre) return;
    const holder = documentNode.createElement("div");
    holder.innerHTML = codeSampleHtml(code.textContent || "", index);
    const card = holder.firstElementChild;
    if (!card) return;
    index += 1;
    pre.replaceWith(card);
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
export function decorateRichHtml(rawHtml, { codeCopy = true } = {}) {
  const html = String(rawHtml || "");
  if (typeof DOMParser === "undefined") return html;
  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  highlightCodeElements(parsed);
  // 先展开「代码块案例」，卡片内的两栏才能被下面两步处理到
  upgradeCodeSamples(parsed);
  // 打印 / 导出用的 HTML 不需要交互按钮
  if (codeCopy) attachCodeCopyButtons(parsed);
  wrapTables(parsed);
  return parsed.body.innerHTML;
}

const COPY_FEEDBACK_MS = 1600;
/** 复制按钮的恢复定时器，按按钮元素记录 */
const copyTimers = new WeakMap();

async function copyTextToClipboard(text) {
  const value = String(text ?? "");
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      /* 非安全上下文或被拒绝，落到下面的降级方案 */
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

function flashCopyButton(button, state) {
  const previous = copyTimers.get(button);
  if (previous) clearTimeout(previous);
  button.dataset.copyState = state;
  button.textContent = state === "copied" ? "已复制" : "复制失败";
  copyTimers.set(
    button,
    setTimeout(() => {
      delete button.dataset.copyState;
      button.textContent = "复制";
      copyTimers.delete(button);
    }, COPY_FEEDBACK_MS),
  );
}

async function handleCodeCopyClick(event) {
  const button = event.target?.closest?.(`.${CODE_COPY_BUTTON_CLASS}`);
  if (!button) return;
  event.preventDefault();
  const pre = button.closest("pre");
  const code = pre?.querySelector("code");
  if (!code) return;
  const ok = await copyTextToClipboard(code.textContent || "");
  flashCopyButton(button, ok ? "copied" : "failed");
}

/**
 * 安装代码块复制的全局点击委托，只安装一次。依赖 document，
 * 因此在应用入口（main.js）显式调用，SSR / 测试环境可安全跳过。
 */
export function installCodeCopyHandler() {
  if (typeof document === "undefined") return;
  if (globalThis.__lifeCodeCopyHandlerInstalled) return;
  globalThis.__lifeCodeCopyHandlerInstalled = true;
  document.addEventListener("click", handleCodeCopyClick);
}

export function highlightCodeText(source, language) {
  const normalized = normalizeCodeLanguage(language);
  const grammar = Prism.languages[normalized];
  if (!normalized || !grammar || normalized === "plain") return "";
  return Prism.highlight(String(source || ""), grammar, normalized);
}
