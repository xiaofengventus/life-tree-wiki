// 入口：compile(source) → AST ；render(source, target) → 字符串。
//
// 「预览与发布跑的是同一个渲染器」在这里被落实成一句代码：
// 两者都只调 render()，没有第二条链路 —— 不一致在结构上不可能发生。

import { N, walk } from './ast.js';
import { makeCtx, LaupError } from './diag.js';
import { scanBlocks } from './scanner.js';
import { renderHtml } from './renderHtml.js';
import { auditHtml, formatViolations } from './whitelist.js';

export { LaupError };
export { dataBlockTypeNames } from './dataBlock.js';

// 扩展点 —— 宿主装自己的元素用这两个（机制说明见 src/extensions.js）。
// 核心**不**预装任何扩展：装什么由宿主决定，缺了谁核心也照跑。
export {
  defineExtension, listExtensions, uninstallExtensions,
  SNIPPET_CARET, extensionSnippets,
} from './extensions.js';

// mode: 'compile'（默认）写错了直接抛错，适合构建/CI；
//       'edit' 容错，把写了一半的语法变成 Broken 节点 + 诊断，编辑器要的是这个。
export function compile(src, opts = {}) {
  const ctx = makeCtx({ tolerant: opts.mode === 'edit' });
  const children = scanBlocks(src, ctx);
  const doc = N.doc(children);
  const stats = lint(doc, ctx, opts);
  return { ast: doc, warnings: ctx.warnings, stats };
}

export function render(src, target = 'html', opts = {}) {
  const { ast, warnings, stats } = compile(src, opts);
  if (target !== 'html') throw new Error(`暂不支持的目标：${target}`);

  const late = [];
  const out = renderHtml(ast, { ...opts, warn: (m) => late.push({ line: null, message: m }) });

  // 产物白名单自检（见 whitelist.js 的文件头）。放在这里而不是"发布时再查"：
  // 预览和发布跑的是同一次 render，自检跟着走，就不会出现"预览好好的、发布出来才发现"。
  // 严格模式抛错（构建/CI/发布要的是当场炸），容错模式降级成告警
  // —— 编辑器不能因为一个渲染 bug 就打不开用户的文章。
  //
  // ⚠️ 用过 `\raw` 就整篇跳过自检。理由不是"算了不查了"，而是**这句承诺不成立了**：
  // 自检核对的是"Laup 自己拼出来的产物"；`\raw` 是用户直通 HTML，那部分产物不是 Laup 写的，
  // 拿 Laup 的名单去判它必然一边倒地报违规（示例文档里就有一处，它是在演示 \raw 本身）。
  // 所以这里明确说出"没查"，而不是假装查过 —— 而发布路径一律拒收 \raw，
  // 于是**真正入库的产物永远经过自检**，这句话是站得住的。
  const violations = stats.rawCount > 0 ? [] : auditHtml(out.html);
  if (stats.rawCount > 0) {
    late.push({
      line: null,
      message: `本文用了 ${stats.rawCount} 处 \\raw，产物白名单自检跳过（它只核对 Laup 自己产出的那部分）。\\raw 在发布路径上会被直接拒收。`,
    });
  }
  if (violations.length) {
    const detail = formatViolations(violations);
    if (opts.mode === 'edit') {
      late.push({
        line: null,
        message: `渲染产物里有 ${violations.length} 项不在 Laup 白名单里（这是 Laup 自己的 bug，不是你的写法问题）：\n${detail}`,
      });
    } else {
      throw new LaupError(
        `渲染产物里有 ${violations.length} 项不在 Laup 白名单里：\n${detail}`,
        null,
        '这是渲染器的问题（它产出了白名单外的标签/属性/样式）。要么修渲染器，要么用 allowEntries() 正式登记这条。',
      );
    }
  }

  return {
    output: out.html,
    // 逐块结果 + 块列表：编辑器靠它们把「屏幕上的块」和源码行对上。
    // parts[i].node.pos === { start, end }，就是这块的源码行号（1-based 闭区间）。
    parts: out.parts,
    blocks: ast.children,
    footnotesHtml: out.footnotesHtml,
    headings: out.headings,
    warnings: warnings.concat(late),
    stats,
  };
}

// 静态检查：只做"编译期能抓、且不改变渲染结果"的提醒
function lint(doc, ctx, opts) {
  let rawCount = 0;
  let equationCount = 0;

  walk(doc, (n) => {
    if (n.type === 'Raw') rawCount += 1;
    if (n.type === 'Equation') equationCount += 1;
    // 这里原本有一条 `h${level} 超出网站正文清洗白名单（只到 h4）` 的告警。
    // 那条规则的定义权不在 Laup 手里 —— 它说的是"某个站点只允许到 h4"，
    // 于是 Laup 自己的标题深度是被别人的白名单决定的。已删除。
    // 现在的规则是 Laup 自己的：h1–h6 全支持，且这六级都登记在
    // src/whitelist.js 的 CORE_TAGS 里，产物自检会兜住（真写了 h7 也进不来，
    // 扫描器本来就把 >6 个 `#` 当普通段落）。
  });

  // \raw 默认容忍 3 处：超过才算"内容脏"，但计数始终输出在编译摘要里
  const rawLimit = opts.rawLimit == null ? 3 : opts.rawLimit;
  if (rawCount > rawLimit) {
    ctx.warn(
      null,
      `本文用了 ${rawCount} 处 \\raw（内容脏度指标，阈值 ${rawLimit}）——` +
        '\\raw 是唯一放行 HTML 的通道，能不用就不用',
    );
  }

  return { rawCount, equationCount };
}

export function formatWarnings(warnings) {
  return warnings
    .map((w) => (w.line == null ? `  warning: ${w.message}` : `  ${w.line} 行: ${w.message}`))
    .join('\n');
}
