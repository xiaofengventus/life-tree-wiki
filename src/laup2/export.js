/**
 * Laup v2 —— AST → 源码导出。
 *
 * 用途：保存、复制、v1/v2 迁移、golden 对比。
 * 原则：导出出来的是**规范化源码**，不保证与原始书写逐字相同，
 *       但保证 `parse(export(doc))` 与原 AST 等价（往返测试盯着这一点）。
 */

import { parse } from "./parser.js";
import { parseCells } from "./cells.js";

const ESCAPE_RE = /([\\`*_~$[\]])/g;
const escapeText = (value) => String(value ?? "").replace(ESCAPE_RE, "\\$1");

export function exportInline(nodes) {
  return (nodes || [])
    .map((node) => {
      switch (node.type) {
        case "Text":
          return escapeText(node.attrs.value);
        case "Break":
          return "\\\\";
        case "CodeInline":
          return `\`${String(node.attrs.value).replace(/`/g, "\\`")}\``;
        case "Math":
          return node.attrs.display ? `$$${node.attrs.tex}$$` : `$${node.attrs.tex}$`;
        case "Strong":
          return `**${exportInline(node.children)}**`;
        case "Em":
          return `*${exportInline(node.children)}*`;
        case "Del":
          return `~~${exportInline(node.children)}~~`;
        case "Underline":
          return `\\underline{${exportInline(node.children)}}`;
        case "Link":
          return `[${exportInline(node.children)}](${node.attrs.href})`;
        case "Image":
          return `![${node.attrs.alt || ""}](${node.attrs.src})`;
        case "Color":
          return node.attrs.color
            ? `\\textcolor{${node.attrs.color}}{${exportInline(node.children)}}`
            : `\\colorbox{${node.attrs.bg}}{${exportInline(node.children)}}`;
        case "Size":
          return `\\fontsize{${node.attrs.size}}{${exportInline(node.children)}}`;
        case "FootnoteRef":
          return `\\footnote{${exportInline(node.children)}}`;
        case "EqRef":
          return `\\eqref{${node.attrs.id}}`;
        case "Cite":
          return `\\cite{${(node.attrs.ids || []).join(",")}}`;
        case "Var":
          return `{{${node.attrs.name}}}`;
        default:
          return "";
      }
    })
    .join("");
}

function fence(value, lang) {
  const body = String(value ?? "");
  const max = Math.max(3, ...(body.match(/`+/g) || []).map((run) => run.length + 1));
  const mark = "`".repeat(max);
  return [mark + (lang || ""), body, mark].join("\n");
}

function exportBlocks(children) {
  return (children || [])
    .map((node) => exportBlock(node))
    .filter((text) => text !== "")
    .join("\n\n");
}

function exportList(node, depth = 0) {
  const indent = "  ".repeat(depth);
  const lines = [];
  (node.children || []).forEach((item, index) => {
    const marker = node.attrs.ordered ? `${(node.attrs.start || 1) + index}. ` : "- ";
    const blocks = item.children || [];
    const first = blocks[0];
    const head = first && first.type === "Para" ? exportInline(first.children) : "";
    lines.push(indent + marker + head);
    for (const block of blocks.slice(first && first.type === "Para" ? 1 : 0)) {
      if (block.type === "List") lines.push(exportList(block, depth + 1));
      else lines.push(exportBlock(block));
    }
  });
  return lines.join("\n");
}

function exportTable(node) {
  const cell = (nodes) => exportInline(nodes).replace(/\|/g, "\\|");
  const align = (letter) =>
    letter === "center" ? ":---:" : letter === "right" ? "---:" : ":---";
  const head = `| ${(node.attrs.head || []).map(cell).join(" | ")} |`;
  const sep = `| ${(node.attrs.align || []).map(align).join(" | ")} |`;
  const rows = (node.attrs.rows || []).map(
    (row) => `| ${row.map(cell).join(" | ")} |`,
  );
  return [head, sep, ...rows].join("\n");
}

function exportEnv(node) {
  const { name, mode, value } = node.attrs;
  if (mode === "raw") {
    return [`\\begin{${name}}`, String(value ?? ""), `\\end{${name}}`].join("\n");
  }
  if (mode === "items") {
    const items = (value || []).map((item) => `\\item ${exportInline(item.children)}`);
    return [`\\begin{${name}}`, ...items, `\\end{${name}}`].join("\n");
  }
  return [`\\begin{${name}}`, exportBlocks(value), `\\end{${name}}`].join("\n");
}

export function exportBlock(node) {
  if (!node) return "";

  switch (node.type) {
    case "Heading":
      return `${"#".repeat(node.attrs.level)} ${exportInline(node.children)}`;
    case "Para":
      return exportInline(node.children);
    case "Quote":
      return exportBlocks(node.children)
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "Center":
      return `\\begin{center}\n${exportBlocks(node.children)}\n\\end{center}`;
    case "Hr":
      return "---";
    case "Code":
      return fence(node.attrs.value, node.attrs.lang || "");
    case "Math":
      return node.attrs.display ? `$$\n${node.attrs.tex}\n$$` : `$${node.attrs.tex}$`;
    case "Equation":
      return [
        `\\begin{equation}${node.attrs.id ? `{${node.attrs.id}}` : ""}`,
        node.attrs.tex,
        "\\end{equation}",
      ].join("\n");
    case "Image":
      return `![${node.attrs.caption || node.attrs.alt || ""}](${node.attrs.src})`;
    case "Cover":
      return `\\cover{${node.attrs.src}}${node.attrs.caption ? `{${node.attrs.caption}}` : ""}`;
    case "Table":
      return exportTable(node);
    case "Todo":
      return [
        "\\begin{todo}",
        ...(node.attrs.items || []).map((item) => {
          const text = Array.isArray(item.text) ? exportInline(item.text) : String(item.text ?? "");
          return `- [${item.done ? "x" : " "}] ${text.split("\n").join("\n  ")}`;
        }),
        "\\end{todo}",
      ].join("\n");
    case "Sample": {
      const panes = node.attrs.panes || [];
      const input = panes.find((pane) => pane.kind === "input")?.value || "";
      const output = panes.find((pane) => pane.kind === "output")?.value || "";
      return ["\\begin{sample}", input, "---", output, "\\end{sample}"].join("\n");
    }
    case "Card": {
      const lines = ["\\begin{card}"];
      const name = exportInline(node.attrs.name);
      if (name && name !== "分类卡片") lines.push(`[name ${name}]`);
      if (node.attrs.color && node.attrs.color !== "skyblue") lines.push(`[color ${node.attrs.color}]`);
      for (const row of node.attrs.rows || []) {
        const value = exportInline(row.value);
        lines.push(row.label ? `${row.label} ${value}` : value);
      }
      lines.push("\\end{card}");
      return lines.join("\n");
    }
    case "TreeEmbed": {
      const title = node.attrs.title || "";
      return [
        "\\begin{tree}",
        String(node.attrs.id || ""),
        ...(title ? [title] : []),
        "\\end{tree}",
      ].join("\n");
    }
    case "Toc":
      return "\\tableofcontents";
    case "List":
      return exportList(node);
    case "Env":
      return exportEnv(node);
    case "Broken":
      return String(node.attrs.src || "");
    default:
      return "";
  }
}

/** 整篇文档 → 源码 */
export function exportSource(docOrSource) {
  const doc = typeof docOrSource === "string" ? parse(docOrSource).doc : docOrSource;
  return `${exportBlocks(doc.children)}\n`;
}

export { exportCells };

/** 整篇 Notebook → 源码（保留格边界与格声明） */
function exportCells(source) {
  const cells = parseCells(source);
  const parts = cells.map((cell) => {
    if (cell.type !== "laup") return cell.source.trim();
    return exportSource(parse(cell.source).doc).trim();
  });
  return `${parts.join("\n\n\\cellbreak=[\n]\n\n")}\n`;
}
