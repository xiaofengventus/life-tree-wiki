/**
 * Laup v2 —— 内核入口。
 *
 * 管线：
 *   源码 → lexBlocks/lexInline（lexer.js）
 *        → parseBlocks/parseInline（parser.js）→ 类型化 AST
 *        → applySemantics（semantic.js）→ 编号 / 目录 / 脚注 / 变量
 *        → renderHtml（render/html.js）→ 目标产物
 *
 * 用法：
 *   import { typeset } from '@/laup2'
 *   const { html, diagnostics } = typeset(src, { variables: { name: 'X' } })
 */

import { parse } from "./parser.js";
import { applySemantics } from "./semantic.js";
import { renderHtml } from "./render/html.js";
import { createDiagnostics, formatDiagnostics } from "./diagnostics.js";

export { N, walk, plainText, slugify } from "./ast.js";
export { parse, parseInline, parseBlocks } from "./parser.js";
export { parseCells, typesetCells, readVarCell, readReferenceCell, evaluate } from "./cells.js";
export { exportSource, exportBlock, exportInline, exportCells } from "./export.js";
export {
  commandCompletions,
  environmentCompletions,
  cellCompletions,
  allCompletions,
} from "./completions.js";
export {
  applySemantics,
  createSemanticState,
  collectSemantics,
  resolveSemantics,
} from "./semantic.js";
export { renderHtml, renderFootnotes, defaultCss, esc, safeHref, safeSrc } from "./render/html.js";
export {
  defineCommand,
  defineEnvironment,
  getCommand,
  getEnvironment,
  commandNames,
  environmentNames,
  resetRegistry,
  safeColor,
  safeSize,
} from "./registry.js";
export { Diagnostic, createDiagnostics, formatDiagnostics } from "./diagnostics.js";

/** 已注册的渲染目标。新增目标 = 往这里加一个纯函数 */
export const targets = { html: renderHtml };

/**
 * 一步到位：解析 + 语义 + 渲染。
 *
 * @param {string} source
 * @param {{
 *   target?: 'html',
 *   variables?: Record<string, unknown>,
 *   mode?: 'edit'|'strict',
 * }} options
 */
export function typeset(source, options = {}) {
  const { doc, diagnostics } = parse(source, { mode: options.mode });
  const report = createDiagnostics(diagnostics);
  const meta = applySemantics(doc, {
    variables: options.variables || {},
    report,
    diagnostics,
  });

  const target = options.target || "html";
  const renderer = targets[target];
  if (!renderer) {
    throw new Error(`未知的渲染目标：${target}（可用：${Object.keys(targets).join(", ")}）`);
  }

  return {
    html: renderer(doc, { meta }),
    doc,
    meta,
    diagnostics,
    /** 诊断的可读文本，便于 CLI / 测试直接打印 */
    messages: formatDiagnostics(diagnostics),
  };
}
