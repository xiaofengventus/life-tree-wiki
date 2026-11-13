// 三个"要吃掉多行"的块读取器：Laup 环境、md 列表、md 管道式表格。
//
// 它们都需要"再扫一遍内部"，所以 `scan` 以参数传入 —— 而不是互相 import。
// 这样两个文件之间没有循环依赖，`scan` 又是同一个实现（递归用的就是主扫描器）。
//
// 抛错时补上 `span`（这个构造占了几行源码），供编辑期的容错模式整块跳过。
// 单行性质的错误不写 span，由 scanner.js 的 guessSpan 兜底。

import { N } from './ast.js';
import { LaupError } from './diag.js';
import { matchList, splitRow, parseAlignRow } from './mdBlock.js';

export const CONTENT_ENVS = new Set(['quote', 'center', 'itemize', 'enumerate']);

// ── \begin{环境} … \end{环境}
export function readEnv(lines, i, base, ctx, out, scan) {
  const no = base + i + 1;
  const m = /^\s*\\begin\{([A-Za-z][A-Za-z0-9]*)\}\s*(.*)$/.exec(lines[i]);
  const name = m[1];
  let id = null;

  if (name === 'equation' && m[2].trim()) {
    const g = /^\{([^}]*)\}\s*$/.exec(m[2].trim());
    if (g) id = g[1].trim();
  }

  const bodyStart = i + 1;
  const body = [];
  const closeRe = new RegExp('^\\s*\\\\end\\{' + name + '\\}\\s*$');
  let j = bodyStart;
  while (j < lines.length && !closeRe.test(lines[j])) { body.push(lines[j]); j++; }

  if (j >= lines.length) {
    throw new LaupError(
      `\\begin{${name}} 没有对应的 \\end{${name}}`,
      no,
      `环境必须闭合，\\end{${name}} 要独占一行`,
      lines.length - i,
    );
  }
  const next = j + 1;
  const span = next - i;
  const innerBase = base + bodyStart;

  if (name === 'equation') {
    out.push(N.equation(id, body.join('\n').trim()));
    return next;
  }

  if (name === 'quote') {
    out.push(N.quote(scan(body, innerBase, ctx)));
    return next;
  }

  if (name === 'center') {
    out.push(N.center(scan(body, innerBase, ctx)));
    return next;
  }

  if (name === 'itemize' || name === 'enumerate') {
    const items = [];
    let cur = null;
    let curBase = innerBase;

    for (let k = 0; k < body.length; k++) {
      const im = /^\s*\\item\s*(.*)$/.exec(body[k]);
      if (im) {
        if (cur) items.push(N.item(scan(cur, curBase, ctx)));
        const inline = im[1].trim();
        cur = inline ? [inline] : [];
        curBase = innerBase + k;
      } else if (cur) {
        cur.push(body[k]);
      } else if (body[k].trim()) {
        throw new LaupError(
          `\\begin{${name}} 里出现了 \\item 之前的内容`,
          innerBase + k + 1,
          '列表项必须由 \\item 开启',
          span,
        );
      }
    }
    if (cur) items.push(N.item(scan(cur, curBase, ctx)));
    if (!items.length) {
      throw new LaupError(`\\begin{${name}} 里没有 \\item`, no, '至少需要一个列表项', span);
    }
    const ordered = name === 'enumerate';
    out.push(N.list(ordered, items, 1));
    return next;
  }

  throw new LaupError(
    `正文区不认识环境 \\begin{${name}}`,
    no,
    '数学环境（cases / aligned / matrix …）请写在 $…$ 或 $$…$$ 内；正文环境白名单：' +
      [...CONTENT_ENVS, 'equation'].join(' / '),
    span,
  );
}

// ── md 列表（含任务列表与一层嵌套）
export function readList(lines, i, base, ctx, out, scan) {
  const first = matchList(lines[i]);
  const ordered = first.ordered;
  const start = first.start;
  const items = [];
  let cur = null;

  const flush = () => {
    if (!cur) return;
    const nodes = scan(cur.lines, base + cur.idx, ctx);
    items.push(N.item(nodes, cur.checked));
    cur = null;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) break;
    const l = matchList(line);

    if (!l) {
      // 续行（缩进 2+ 的普通文本）
      if (cur && /^\s{2,}\S/.test(line)) {
        cur.lines.push(line.replace(/^\s{2,4}/, ''));
        i++;
        continue;
      }
      break;
    }

    if (l.indent > 0 && cur) {
      // 嵌套：整行（去掉一级缩进）塞进当前项的内容里，交给递归扫描处理
      cur.lines.push(line.replace(/^\s{2,4}/, ''));
      i++;
      continue;
    }
    // 缩进的列表行在"首行"出现（cur 还没建立，典型如 AI 输出的 " * …"）：
    // 必须按顶级项处理。此前 `if (!cur) break` 会在 i 不前进的情况下返回，
    // 外层 scan 对同一行无限重入 matchList → readList → 渲染死循环（页面崩溃）。

    flush();
    cur = { indent: 0, idx: i, checked: l.checked, lines: [l.content] };
    i++;
  }
  flush();

  out.push(N.list(ordered, items, start));
  return i;
}

// ── md 管道式表格（第②档的兼容写法，与 \table=[…] 编译到同一个 Table 节点）
export function readPipeTable(lines, i, base, ctx, out) {
  const header = splitRow(lines[i]);
  const align = parseAlignRow(lines[i + 1]);
  const startNo = base + i + 1;
  i += 2;

  const rows = [];
  while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
    const cells = splitRow(lines[i]);
    if (cells.length !== header.length) {
      ctx.warn(
        base + i + 1,
        `这一行有 ${cells.length} 个单元格，但表头有 ${header.length} 列`,
      );
    }
    rows.push(cells);
    i++;
  }

  out.push(N.table(header, rows, { align: align.length === header.length ? align : '' }));
  ctx.warn(
    startNo,
    '管道式表格对宽表和含空格的单元格不好维护，可考虑 \\table=[ … ]（与管道式编译到同一个节点）',
  );
  return i;
}
