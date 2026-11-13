// Markdown 侧的**纯形状识别**助手。
//
// ⚠️ 这里只是"够跑通第①档"的子集，不是完整的 CommonMark。
// 规范 §11 的工程建议是：块结构用 micromark + GFM 拿 token，只写 token → AST 映射层。
// 这一版把所有函数做成纯函数，就是为了将来整体替换时**只换实现、不动调用方**。

export function matchFence(line) {
  const m = /^\s*(`{3,}|~{3,})\s*([A-Za-z0-9_+-]*)\s*$/.exec(line);
  if (!m) return null;
  return { marker: m[1][0], len: m[1].length, lang: m[2] };
}

export function matchHeading(line) {
  const m = /^(#{1,6})\s+(.*)$/.exec(line);
  if (!m) return null;
  return { level: m[1].length, text: stripClosingHashes(m[2]) };
}

function stripClosingHashes(s) {
  return s.replace(/\s+#+\s*$/, '').trim();
}

export function matchHr(line) {
  return /^\s*(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line);
}

export function matchList(line) {
  const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
  if (!m) return null;
  const ordered = /\d/.test(m[2]);
  const start = ordered ? parseInt(m[2], 10) : 1;
  let content = m[3];
  let checked = null;
  const task = /^\[([ xX])\]\s*(.*)$/.exec(content);
  if (task) {
    checked = task[1].toLowerCase() === 'x';
    content = task[2];
  }
  return { indent: m[1].replace(/\t/g, '    ').length, ordered, start, content, checked };
}

export function matchQuote(line) {
  const m = /^\s*>\s?(.*)$/.exec(line);
  return m ? m[1] : null;
}

export function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(line) && line.includes('-');
}

// 拆一行管道式表格，`\|` 是转义的字面竖线
export function splitRow(line) {
  const s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const out = [];
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') { buf += '|'; i++; continue; }
    if (s[i] === '|') { out.push(buf.trim()); buf = ''; continue; }
    buf += s[i];
  }
  out.push(buf.trim());
  return out;
}

export function parseAlignRow(line) {
  return splitRow(line)
    .map((cell) => {
      const l = cell.startsWith(':');
      const r = cell.endsWith(':');
      if (l && r) return 'c';
      if (r) return 'r';
      if (l) return 'l';
      return 'l';
    })
    .join('');
}

// 这一行是否开启了新的块？（用于给段落找终点）
export function startsBlock(line) {
  if (!line.trim()) return true;
  if (matchFence(line)) return true;
  if (matchHeading(line)) return true;
  if (matchHr(line)) return true;
  if (matchList(line)) return true;
  if (matchQuote(line) !== null) return true;
  if (/^\s*\$\$\s*$/.test(line)) return true;
  if (/^\s*\\/.test(line)) return true; // 一切 Laup 块
  return false;
}
