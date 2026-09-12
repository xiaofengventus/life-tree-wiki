// Markdown 导出：HTML → Markdown
import { downloadText } from "./index";
import { timestamp } from "./index";

async function createTurndown() {
  const TurndownService = (await import("turndown")).default;
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    hr: "---",
  });

  // GFM 表格支持
  turndown.use([
    (service) => {
      service.addRule("tableCell", {
        filter: ["th", "td"],
        replacement: (content) => {
          return ` ${content.trim()} |`;
        },
      });
      service.addRule("tableRow", {
        filter: "tr",
        replacement: (content, node) => {
          const cells = node.querySelectorAll("th, td");
          // 表头行后加分隔行
          const isHeader = [...cells].some((c) => c.tagName === "TH");
          let output = `|${content}`;
          if (isHeader && !node.dataset.headerProcessed) {
            const separators = [...cells].map(() => "---").join("|");
            output += `\n|${separators}|`;
          }
          return `${output}\n`;
        },
      });
      service.addRule("table", {
        filter: "table",
        replacement: (content) => `\n\n${content}\n`,
      });
    },
  ]);

  // 图片注释 (figure/figcaption) → 图片 + alt
  turndown.addRule("figure", {
    filter: "figure",
    replacement: (content, node) => {
      const img = node.querySelector("img");
      const caption = node.querySelector("figcaption");
      const alt =
        caption?.textContent?.trim() || img?.getAttribute("alt") || "";
      const src = img?.getAttribute("src") || "";
      if (!src) return content;
      return `![${alt}](${src})\n\n`;
    },
  });

  // 引用链接保留
  turndown.addRule("citationLink", {
    filter: (node) =>
      node.nodeName === "A" &&
      /^#post-citation-\d+$/.test(node.getAttribute("href") || ""),
    replacement: (content) => content,
  });

  // 公式节点 → LaTeX
  turndown.addRule("formula", {
    filter: (node) => node.hasAttribute && node.hasAttribute("data-life-math"),
    replacement: (content, node) => {
      const latex = node.getAttribute("data-latex") || content;
      const mode = node.getAttribute("data-life-math");
      return mode === "block" ? `$$${latex}$$` : `$${latex}$`;
    },
  });

  // 待办事项
  turndown.addRule("todoItem", {
    filter: (node) =>
      node.getAttribute && node.getAttribute("data-w-e-type") === "todo",
    replacement: (content, node) => {
      const checked = node.querySelector("input[checked]");
      return `- [${checked ? "x" : " "}] ${content.trim()}\n`;
    },
  });

  return turndown;
}

/**
 * 将 HTML 转为 Markdown 字符串（不下载）。用于 Markdown 编辑模式下回显已有内容。
 */
export async function htmlToMarkdownString(html) {
  const turndown = await createTurndown();
  return turndown.turndown(html || "");
}

export async function exportMarkdown(html, title = "专栏文章") {
  const turndown = await createTurndown();
  const markdown = turndown.turndown(html || "");
  const header = `# ${title || "专栏文章"}\n\n`;
  downloadText(
    header + markdown,
    `${title || "专栏文章"}_${timestamp()}.md`,
    "text/markdown",
  );
}
