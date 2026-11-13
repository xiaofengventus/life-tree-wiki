// 生命时序专属元素 —— 宿主扩展的**参考实现**。
//
// ── 这个文件为什么不在 src/ 里
//   这四样东西只对生命时序 wiki 成立：
//     ```sample        代码样例卡片（`life-code-sample` 那套 class）
//     \cite{1,3}       正文引用锚点（锚点前缀要能对上站点的点击滚动）
//     \references=[ ]  参考文献列表（`content-sources` 那套 class）
//     \tree=[ id="" ]  研究树嵌入（占位骨架 + 跳转 `/life-tree/:id`）
//   它们的 class 名、路由、锚点前缀都是**那个站点**的约定，不是文档语法的通用部分。
//   所以它们住在核心之外，由宿主用 defineExtension() 装进去（机制见 src/extensions.js）。
//
// ── 怎么装
//     import { defineExtension } from 'laup';            // 或 laup/src/index.js
//     import { lifeElements } from 'laup/extensions/life.js';
//     defineExtension(lifeElements());
//
//   站点要换成自己已有的锚点前缀 / 路由，传 options 就行 —— 不用改这个文件，
//   更不用改核心：
//     defineExtension(lifeElements({ citationAnchor: 'post-citation' }));
//
// ── 不装的后果
//     ```sample     → 一个 sample 语言的普通代码块（核心本来就有代码块）
//     \cite{1}      → warning：未知命令，按字面量输出
//     \references=  → LaupError：未知的数据块类型
//     \tree=[…]     → LaupError：未知的数据块类型

import { esc } from '../core/escape.js';
import { walk } from '../core/ast.js';
import { LaupError } from '../core/diag.js';
import { SNIPPET_CARET } from '../core/extensions.js';

export const PACK_NAME = 'life-elements';

// 代码案例的载体：语言名为 `sample` 的围栏代码块。
// ⚠️ 这里仍然"寄生在 md 代码块上"—— 不新增形状、不新增元素类型，
// 所以编辑、撤销、粘贴、导入导出全部白捡。扩展点换掉的是**归属**，不是载体。
export const SAMPLE_LANG = 'sample';
export const SAMPLE_ATTR = 'data-life-code-sample';

// ── 本站自己的节点形状（不进核心 ast.js）
const node = {
  sample: (input, output) => ({ type: 'Sample', input, output }),
  citation: (numbers) => ({ type: 'Citation', numbers }),
  references: (items, title) => ({ type: 'References', items, title: title || '参考文献' }),
  tree: (id, opts) => ({
    type: 'Tree',
    id,
    title: (opts && opts.title) || '',
    caption: (opts && opts.caption) || '',
    height: (opts && opts.height) || 500,
  }),
};

// ── 代码案例：围栏内容切成 输入 / 输出 两段
//
// 用**独占一行**的 `---` / `===` 分隔，取第一个匹配行 —— 与生命时序 wiki 现状一致。
// 代码里需要独占一行的 `---` 时，改用 `===` 逃生（纯词法判定无法区分二者）。
const SEPARATOR = /^\s*(?:-{3,}|={3,})\s*$/;
const MAX_SIDE_LENGTH = 20_000;
const EMPTY_PLACEHOLDER = '（空）';

function trimBlank(lines) {
  let s = 0;
  let e = lines.length;
  while (s < e && !lines[s].trim()) s++;
  while (e > s && !lines[e - 1].trim()) e--;
  return lines.slice(s, e);
}

const clip = (v) => String(v).slice(0, MAX_SIDE_LENGTH);

/** 把围栏内容切成输入 / 输出两段。第一个独占一行的 `---` / `===` 是分隔符。 */
export function parseSample(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const at = lines.findIndex((l) => SEPARATOR.test(l));
  const has = at >= 0;
  return {
    separated: has,
    input: clip(trimBlank(has ? lines.slice(0, at) : lines).join('\n')),
    output: clip(trimBlank(has ? lines.slice(at + 1) : []).join('\n')),
  };
}

function paneHtml(kind, index, body) {
  const isInput = kind === 'input';
  const label = isInput ? '输入' : '输出';
  const sub = isInput ? 'Input' : 'Output';
  return [
    `<div class="life-code-sample-pane ${isInput ? 'is-input' : 'is-output'}">`,
    `<div class="life-code-sample-pane-head">`,
    `<span class="life-code-sample-label">${label}<em>#${index}</em></span>`,
    `<span class="life-code-sample-sub">${sub}</span>`,
    `</div>`,
    // 内容用 <pre><code>，代码块的「复制」按钮能原样复用到这两栏
    `<pre class="life-code-sample-body"><code>${esc(body.length ? body : EMPTY_PLACEHOLDER)}</code></pre>`,
    `</div>`,
  ].join('');
}

/**
 * 渲染成卡片。`index` 是它在文中的序号（第 1 个是 0）。
 * 空的一侧不渲染 —— 只写输入就是单栏「输入」，只写输出就是单栏「输出」。
 * 两侧都空（例如只敲了一个 `---`）时保留「输入」占位栏，避免卡片只剩一个标题。
 */
export function sampleHtml(nodeIn, index = 0) {
  const input = nodeIn.input || '';
  const output = nodeIn.output || '';
  const panes = [];
  if (input || !output) panes.push(paneHtml('input', index, input));
  if (output) panes.push(paneHtml('output', index, output));
  return [
    `<div class="life-code-sample" ${SAMPLE_ATTR}="1">`,
    `<div class="life-code-sample-head">`,
    `<span class="life-code-sample-bar"></span>`,
    `<span class="life-code-sample-title">样例</span>`,
    `<span class="life-code-sample-title-en">Sample</span>`,
    `</div>`,
    `<div class="life-code-sample-grid${panes.length < 2 ? ' is-single' : ''}">`,
    panes.join(''),
    `</div>`,
    `</div>`,
  ].join('');
}

// ── 工厂
export function lifeElements(options = {}) {
  // 锚点前缀：站点已经有一版认 `post-citation-N` 的阅读页，接回来时传这个选项即可零改造。
  // 默认用 Laup 自己的命名 —— 站点专属的名字由**站点配置**给出，不藏在默认值里。
  const citationAnchor = options.citationAnchor || 'laup-citation';
  // 文献列表标题的锚点（`\cite` 只看条目锚点，这个是给目录/外链直接跳"参考文献"用的）
  const referencesAnchor = options.referencesAnchor || 'laup-references';
  // 研究树的跳转路由。核心渲染器里原来写死了 `/life-tree/`，现在由宿主给。
  const treeRoute = typeof options.treeRoute === 'function'
    ? options.treeRoute
    : (id) => `${options.treeBase || '/life-tree/'}${id}`;

  const citeId = (n) => `${citationAnchor}-${n}`;

  return {
    name: PACK_NAME,

    blockTypes: ['Sample', 'Tree', 'References', 'CellBreak', 'VarCell'],
    inlineTypes: ['Citation'],

    fenceLangs: {
      [SAMPLE_LANG]: (text) => {
        const parsed = parseSample(text);
        return node.sample(parsed.input, parsed.output);
      },
    },

    // 行内引用：`\cite{1}` / `\cite{1,3}`。**序号越界在渲染期检查** ——
    // 那时才知道 \references 一共有几条（跨块信息，行内解析时看不到）。
    inlineCommands: {
      cite: {
        n: 1,
        build: (a, rec, ctx) => {
          const parts = String(a[0]).split(/[,，\s]+/).filter(Boolean);
          if (!parts.length) {
            throw new LaupError('\\cite{} 里没有序号', ctx.line, '写成 \\cite{1} 或 \\cite{1,3}');
          }
          const numbers = parts.map((s) => Number(s));
          for (let k = 0; k < numbers.length; k++) {
            if (!Number.isInteger(numbers[k]) || numbers[k] < 1) {
              throw new LaupError(
                `\\cite{${a[0]}} 里的 "${parts[k]}" 不是正整数`,
                ctx.line,
                '文献序号从 1 开始，与 \\references 里的顺序一致',
              );
            }
          }
          return [node.citation(numbers)];
        },
      },
    },

    dataBlocks: {
      // Notebook 格边界（宿主层约定）：编译时**零输出**，阅读页看不到它。
      // Notebook 导出文档用它标记"这里原来是一个格"，重新载入时按它精确切格 ——
      // 否则格内段落间的空行和格与格之间的空行无法区分，一格会被拆成很多格。
      cellbreak: {
        fields: {},
        build() {
          return { type: 'CellBreak' };
        },
      },

      // Notebook 变量格（宿主层约定）：**零输出**，阅读页看不到它。
      // 位置型 —— 一行一个字符串元素，每个元素是变量格源码的一行。
      // 变量定义随文档走，正文里的 {{name}} 才会在重新编辑时复活（否则
      // content_laup 只是"内联后的快照"，回不来）。读写口径见 shared/notebookVars.js。
      // 这里只负责"认得它、渲染成空"，内容一个字段都不看。
      varcell: {
        positional: true,
        fields: {},
        build() {
          return { type: 'VarCell' };
        },
      },

      // 研究树：**只有引用，没有数据**。数据在后端且独立演进，
      // 所以产物里只有占位骨架 + 一个 id，静态打开不报错、也不泄露树数据。
      tree: {
        fields: {
          id: { kind: 'string', required: true },
          title: { kind: 'string', required: false },
          caption: { kind: 'string', required: false },
          height: { kind: 'string', required: false },
        },
        build(fields, ctx, line) {
          const id = fields.id.value.trim();
          if (!id) {
            throw new LaupError(
              '\\tree=[ 的 `id` 不能为空',
              fields.id.line,
              'id 是树的标识，运行时靠它去后端取数据',
            );
          }
          let height = 500;
          if (fields.height) {
            const want = Number(fields.height.value);
            if (!Number.isFinite(want)) {
              ctx.warn(fields.height.line, `height "${fields.height.value}" 不是数字，改用默认值 500`);
            } else {
              height = Math.max(240, Math.min(900, Math.round(want)));
              if (height !== Math.round(want)) {
                ctx.warn(fields.height.line, `height 限制在 240–900，实际用 ${height}`);
              }
            }
          }
          return node.tree(id, {
            title: fields.title ? fields.title.value : '',
            caption: fields.caption ? fields.caption.value : '',
            height,
          });
        },
      },

      // 参考文献：位置型 —— 条目一行一条，按顺序自动编号，编号即 \cite 的序号。
      references: {
        positional: true,
        fields: {
          title: { kind: 'string', required: false },
        },
        build(fields, ctx, line, positional) {
          if (!positional.length) {
            throw new LaupError('\\references=[ 里没有任何条目', line, '至少写一条文献，一行一条');
          }
          for (const p of positional) {
            if (!p.value.trim()) {
              throw new LaupError(
                '\\references=[ 里有空条目',
                p.line,
                '每条文献都要有内容——空条目会让编号看起来与列表错位',
              );
            }
          }
          return node.references(
            positional.map((p) => p.value),
            fields.title ? fields.title.value : '',
          );
        },
      },
    },

    // 产物白名单：这些条目是本站特有的（`life-` / `tree-` 前缀就是证据），
    // 由本扩展自己登记，核心名单不为它们让路。
    whitelist: {
      attrs: [SAMPLE_ATTR, 'data-tree-id', 'data-height'],
      // 占位画布的高度：`Math.max(240, Math.min(900, …))` 出来的有界整数，形状收在 px 上。
      styleProps: { height: /^\d+(?:\.\d+)?px$/ },
    },

    // 每次渲染一份状态：编号计数器与跨块集合都是"整篇"范围的信息，
    // 不能挂在闭包上 —— 同一篇文档可能在同一张页面上渲染两次（正文 + 浮层）。
    createState: () => ({
      sampleIndex: 0,
      cited: new Set(),
      refNodes: [],
      refCount: 0,
    }),

    setup(state, doc, ctx) {
      walk(doc, (n) => {
        if (n.type === 'References') state.refNodes.push(n);
      });
      state.refCount = state.refNodes.length ? state.refNodes[0].items.length : 0;
      if (state.refNodes.length > 1) {
        ctx.warn(`一篇里有 ${state.refNodes.length} 个 \\references 块，编号会各自从 1 开始，\\cite 无法区分。建议合并成一个`);
      }
    },

    // 反向校验：有条目却从没被引用。旧系统里永远不会被发现（没有机制），
    // 在 Laup 里是编译期就能报出来的一句提示。
    finish(state, ctx) {
      for (let n = 1; n <= state.refCount; n++) {
        if (!state.cited.has(n)) ctx.warn(`第 ${n} 条文献没有被任何 \\cite 引用`);
      }
    },

    renderBlock(n, ctx) {
      const state = ctx.extState(PACK_NAME);
      switch (n.type) {
        case 'Sample':
          return sampleHtml(n, state.sampleIndex++);
        case 'Tree':
          return renderTree(n, treeRoute);
        case 'References':
          return renderReferences(n, ctx, citeId, referencesAnchor);
        case 'CellBreak':
          return '';
        case 'VarCell':
          return ''; // 变量格：零输出（内容由宿主层读取，见 shared/notebookVars.js）
        default:
          return '';
      }
    },

    renderInline(n, ctx) {
      if (n.type !== 'Citation') return '';
      const state = ctx.extState(PACK_NAME);
      // \cite{1}   →  <sup>[1]</sup>，数字是链接
      // \cite{1,3} →  一个 [ ] 里每个数字各自可点
      const links = [];
      for (const num of n.numbers) {
        state.cited.add(num);
        if (num > state.refCount) {
          // 旧系统里这个错误的表现是"点了跳不动"，没有任何提示。
          // 这里在编译期就报出来 —— 这是 Laup 相对现状的实质改进之一。
          ctx.warn(`\\cite{${num}} 找不到对应的文献条目（\\references 共有 ${state.refCount} 条）`);
          links.push(`<span class="laup-cite-bad">${num}?</span>`);
        } else {
          links.push(`<a class="inline-citation-link" href="#${esc(ctx.aid(citeId(num)))}">${num}</a>`);
        }
      }
      return `<sup class="laup-cite">[${links.join(',')}]</sup>`;
    },

    // 插入骨架模板（工具栏的 `data-ins` 按钮取用）。
    // `▮` 是光标落点，见 src/extensions.js 的 SNIPPET_CARET。
    snippets: {
      cite: `\\cite{${SNIPPET_CARET}}`,
      tree: `\\tree=[\n    id="${SNIPPET_CARET}"\n]`,
      sample: `\`\`\`sample\n${SNIPPET_CARET}\n\`\`\``,
      references: `\\references=[\n    "${SNIPPET_CARET}"\n]`,
    },
  };
}

// 进化树占位骨架：**只输出占位，不输出树数据**。
// 运行时（网站自己的 ResearchTreeEmbed 那一层）认 data-tree-id 后接管画布，
// 于是静态产物在任何地方打开都不报错，而且产物里不含任何树数据。
function renderTree(n, treeRoute) {
  const h = Math.max(240, Math.min(900, Number(n.height) || 500));
  const cap = n.caption ? `<figcaption>${esc(n.caption)}</figcaption>` : '';
  return [
    `<section class="research-tree-embed" data-tree-id="${esc(n.id)}" data-height="${h}">`,
    `<header>`,
    `<div>`,
    `<span>RESEARCH TREE</span>`,
    `<strong>${esc(n.title || '进化树')}</strong>`,
    `</div>`,
    `<a href="${esc(treeRoute(n.id))}">打开完整页面</a>`,
    `</header>`,
    `<div class="embed-canvas" style="height:${h}px"><p>正在加载进化树……</p></div>`,
    cap,
    `</section>`,
  ].filter(Boolean).join('\n');
}

// 参考文献列表：条目按顺序编号。
function renderReferences(n, ctx, citeId, referencesAnchor) {
  const items = n.items
    .map((text, k) => `<li id="${esc(ctx.aid(citeId(k + 1)))}" tabindex="-1">`
      + `<span class="reference-number">[${k + 1}]</span>`
      + `<span>${esc(text)}</span></li>`)
    .join('\n');
  return `<section class="content-sources">\n`
    + `<h2 id="${esc(ctx.aid(referencesAnchor))}">${esc(n.title)}</h2>\n`
    + `<ol class="inline-reference-list">\n${items}\n</ol>\n</section>`;
}
