/**
 * 文档内自定义模板（纯文本宏，**不内置任何样式**）。
 *
 * 模板本身由用户用普通 Markdown / LaTeX 写成，需要填空的地方写 `{{名字}}`；
 * 调用时用 `# 名字` 分节提供内容，渲染时把内容填回对应位置。
 * 外观完全取决于模板里自己写的标题、分隔线、颜色、公式 —— 这里只做文本替换。
 *
 *     \begin{template name="oj"}
 *     ## 题目描述 <small>Description</small>
 *     ---
 *     {{题目描述}}
 *
 *     ## 输入格式 <small>Input</small>
 *     ---
 *     {{输入格式}}
 *     \end{template}
 *
 *     \begin{oj}
 *     # 题目描述
 *     给出一个图的邻接矩阵……
 *
 *     # 输入格式
 *     第一行输入 $t$
 *     \end{oj}
 *
 * 占位符取值规则：
 *   - `{{名字}}`   ← 调用里 `# 名字` 这一节的正文（可以是多段 Markdown）
 *   - `{{content}}` ← 调用里的整段正文（含小节标题），适合只做一层外框的模板
 *   - 找不到对应小节时填空字符串，不会报错
 *
 * 只有**已声明**的模板名会被当成模板调用，`\begin{aligned}`、`\begin{cases}`
 * 这类 LaTeX 环境不受影响。定义只在同一份源码内有效。
 */

const TOKEN_PREFIX = "LIFETREETEMPLATETOKEN";
const MAX_BODY_LENGTH = 50_000;
const MAX_TEMPLATES = 20;
const MAX_PLACEHOLDER = 40;

const TPL_OPEN_RE = /^[ \t]*\\begin\{template(?:\s+name\s*=\s*"?([\w-]{1,32})"?|\s+([\w-]{1,32}))\}[ \t]*$/;
const TPL_CLOSE_RE = /^[ \t]*\\end\{template\}[ \t]*$/;
const HEADING_RE = /^[ \t]{0,3}#{1,6}[ \t]+(.*)$/;
const FENCE_RE = /^[ \t]{0,3}(`{3,}|~{3,})/;
const PLACEHOLDER_RE = /\{\{[ \t]*([^{}\n]{1,40}?)[ \t]*\}\}/g;

/** 小节键名允许 `中文 | English` 这种写法，取竖线前那段 */
function sectionKey(title) {
  return String(title || "").split("|")[0].trim();
}

/**
 * 摘出所有模板声明，返回去掉声明后的源码与模板表。
 *
 * @param {string} source
 * @returns {{ source: string, templates: Map<string, {name: string, body: string}> }}
 */
export function collectTemplates(source) {
  const text = String(source ?? "");
  if (!text.includes("\\begin{template")) {
    return { source: text, templates: new Map() };
  }

  const templates = new Map();
  const lines = text.split("\n");
  const out = [];
  let collecting = null;
  let fenceChar = "";
  let fenceLength = 0;

  for (const line of lines) {
    if (collecting) {
      if (TPL_CLOSE_RE.test(line)) {
        if (templates.size < MAX_TEMPLATES) {
          const body = collecting.lines.join("\n").trim();
          if (collecting.name && body) {
            templates.set(collecting.name, { name: collecting.name, body });
          }
        }
        out.push("");
        collecting = null;
        continue;
      }
      collecting.lines.push(line);
      continue;
    }

    const fence = FENCE_RE.exec(line);
    if (fence) {
      const char = fence[1][0];
      const length = fence[1].length;
      if (!fenceChar) {
        fenceChar = char;
        fenceLength = length;
      } else if (char === fenceChar && length >= fenceLength) {
        fenceChar = "";
        fenceLength = 0;
      }
      out.push(line);
      continue;
    }
    if (fenceChar) {
      out.push(line);
      continue;
    }

    const open = TPL_OPEN_RE.exec(line);
    if (open) {
      const name = open[1] || open[2];
      if (name && !templates.has(name)) {
        if (out.length && out[out.length - 1].trim() !== "") out.push("");
        collecting = { name, lines: [] };
      }
      continue;
    }
    out.push(line);
  }

  // 未闭合的声明按字面量保留，避免吞掉后文
  if (collecting) out.push("\\begin{template}", ...collecting.lines);
  return { source: out.join("\n"), templates };
}

/** 把调用正文按 `#` 标题切成 「标题 → 正文」 的映射 */
export function splitSections(body) {
  const sections = [];
  let current = { title: "", lines: [] };
  for (const line of String(body ?? "").split("\n")) {
    const heading = HEADING_RE.exec(line);
    if (heading) {
      if (current.title || current.lines.some((item) => item.trim())) sections.push(current);
      current = { title: heading[1].trim(), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  if (current.title || current.lines.some((item) => item.trim())) sections.push(current);
  return sections.map((section) => ({ title: section.title, body: section.lines.join("\n").trim() }));
}

/**
 * 找出所有模板调用，换成占位标记。
 *
 * @param {string} source
 * @param {Map<string, object>} templates collectTemplates 的结果
 * @returns {{ source: string, usages: Array }}
 */
export function collectTemplateUsages(source, templates) {
  const text = String(source ?? "");
  if (!templates || !templates.size) return { source: text, usages: [] };

  const lines = text.split("\n");
  const out = [];
  const usages = [];
  let current = null;
  let fenceChar = "";
  let fenceLength = 0;
  const closeRe = () =>
    new RegExp(`^[ \\t]*\\\\end\\{${current.name}\\}[ \\t]*$`);
  const openRe = /^[ \t]*\\begin\{([A-Za-z][\w-]{0,31})\}[ \t]*$/;

  for (const line of lines) {
    if (current) {
      if (closeRe().test(line)) {
        const body = current.lines.join("\n").slice(0, MAX_BODY_LENGTH);
        out.push(`${TOKEN_PREFIX}${usages.length}`);
        usages.push({ name: current.name, body, definition: templates.get(current.name) });
        out.push("");
        current = null;
        continue;
      }
      current.lines.push(line);
      continue;
    }

    const fence = FENCE_RE.exec(line);
    if (fence) {
      const char = fence[1][0];
      const length = fence[1].length;
      if (!fenceChar) {
        fenceChar = char;
        fenceLength = length;
      } else if (char === fenceChar && length >= fenceLength) {
        fenceChar = "";
        fenceLength = 0;
      }
      out.push(line);
      continue;
    }
    if (fenceChar) {
      out.push(line);
      continue;
    }

    const open = openRe.exec(line);
    if (open && templates.has(open[1])) {
      if (out.length && out[out.length - 1].trim() !== "") out.push("");
      current = { name: open[1], lines: [] };
      continue;
    }
    out.push(line);
  }

  if (current) out.push(`\\begin{${current.name}}`, ...current.lines);
  return { source: out.join("\n"), usages };
}

/**
 * 把调用正文填进模板的 `{{占位符}}`，得到一段普通 Markdown 源码。
 *
 * @param {{body: string}} usage
 * @param {{body: string}} definition
 * @returns {string}
 */
export function fillTemplate(usage, definition) {
  const templateBody = String(definition?.body ?? "");
  const usageBody = String(usage?.body ?? "");
  if (!templateBody) return usageBody;

  const values = new Map();
  for (const section of splitSections(usageBody)) {
    if (!section.title) continue;
    if (section.title.length <= MAX_PLACEHOLDER) values.set(section.title, section.body);
    const key = sectionKey(section.title);
    if (key) values.set(key, section.body);
  }

  // 模板里一个占位符都没有：说明它只是外框，直接把内容接在后面
  if (!/\{\{[ \t]*[^{}\n]{1,40}?[ \t]*\}\}/.test(templateBody)) {
    return `${templateBody}\n\n${usageBody}`;
  }

  return templateBody.replace(PLACEHOLDER_RE, (match, rawName) => {
    const name = String(rawName).trim();
    if (name.toLowerCase() === "content") return `\n${usageBody}\n`;
    return `\n${values.get(name) ?? ""}\n`;
  });
}

/**
 * 把占位段落换回渲染结果。
 *
 * @param {string} html micromark 输出
 * @param {Array} usages collectTemplateUsages 的结果
 * @param {(markdown: string) => string} renderMarkdown 把填好的 Markdown 渲染成 HTML
 * @returns {string}
 */
export function renderTemplateUsages(html, usages, renderMarkdown) {
  if (!usages || !usages.length) return html;
  const pattern = new RegExp(
    `<p>[ \\t\\n]*${TOKEN_PREFIX}(\\d+)[ \\t\\n]*</p>`,
    "g",
  );
  return String(html ?? "").replace(pattern, (match, index) => {
    const usage = usages[Number(index)];
    if (!usage) return match;
    return renderMarkdown(fillTemplate(usage, usage.definition));
  });
}
