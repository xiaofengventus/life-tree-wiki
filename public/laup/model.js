// 编辑器的**纯逻辑**（不碰 DOM），所以能直接单测。
// 这里是编辑器最容易出错的地方：源码写回 + 行号平移。
//
// 为什么要自己维护行号：打字期间**不能重新编译**（重编译会产出新的 blocks 对象，
// 而 DOM 还引用着旧的）。所以块的 pos 得由我们手动维护，直到光标离开块。
// 见 editor/editor.js 顶部的两条硬约束。

// 取某一块的源码文本
export function sliceBlock(src, blk) {
  return src.split('\n').slice(blk.pos.start - 1, blk.pos.end).join('\n');
}

// 某一块的首字符在**整篇源码**里的偏移。
// 渲染态的块级按钮要用：那边的选区是 DOM 上的，但格式动作要作用在整篇源码上，
// 所以得先把"第几行"换算成"第几个字符"。
// （行号是 1-based 闭区间，所以第 start 行的首字符 = 前 start-1 行的字符数 + 那些换行符。）
export function blockStartOffset(src, blk) {
  if (!blk) return 0;
  const lines = src.split('\n');
  let off = 0;
  for (let i = 0; i < blk.pos.start - 1 && i < lines.length; i += 1) off += lines[i].length + 1;
  return off;
}

// 某一块覆盖的源码区间（首字符偏移 → 末字符之后），
// 等价于 sliceBlock(src, blk) 在整篇源码里的位置。
export function blockRange(src, blk) {
  const start = blockStartOffset(src, blk);
  return { start, end: start + sliceBlock(src, blk).length };
}

// 源码行号 → 块索引。落在块之间的空行上时取**下一块**（更符合"我要写这里"的直觉）。
export function blockIndexAt(blocks, line) {
  if (line == null || !blocks.length) return -1;
  for (let k = 0; k < blocks.length; k++) {
    if (line >= blocks[k].pos.start && line <= blocks[k].pos.end) return k;
  }
  for (let k = 0; k < blocks.length; k++) {
    if (blocks[k].pos.start > line) return k;
  }
  return blocks.length - 1;   // 落在文末空行 → 取最后一块
}

// 把第 index 块的内容整体换成 newText，返回新的 source。
// **就地更新** blocks 里这块以及它后面所有块的行号 —— 这正是"不能重编译"那段时间里
// 必须自己维护的东西。返回 delta，供调用方判断这一块的拓扑有没有变。
export function applyBlockEdit(src, blocks, index, newText) {
  const blk = blocks[index];
  const ls = src.split('\n');
  const oldEnd = blk.pos.end;
  const newLines = String(newText).split('\n');
  const delta = newLines.length - (oldEnd - blk.pos.start + 1);

  const next = ls.slice(0, blk.pos.start - 1).concat(newLines, ls.slice(oldEnd)).join('\n');
  blk.pos.end = blk.pos.start + newLines.length - 1;

  if (delta !== 0) {
    for (const b of blocks) {
      if (b !== blk && b.pos.start > oldEnd) {
        b.pos.start += delta;
        b.pos.end += delta;
      }
    }
  }

  return { source: next, delta };
}

// ── 块级操作：插入空块 / 上下移动
//
// 这一组是「编辑器分块」最容易翻车的地方（生命时序 wiki 那边做过两版、整体回退过），
// 所以刻意全部做成纯函数、只碰 source 与 blocks 的行号，一个 DOM 都不碰。
//
// 插入空块的做法值得说明：**只插一个空行**（空行不构成块，scanner 会跳过），
// 由调用方把一个「幻影块」塞进 blocks（pos 正好覆盖那一行）。
// 这样 makeEditor / applyBlockEdit / 撤销栈全部原样复用 —— 不需要给编辑器加第二套写回路径。
// 用户真打出内容后，下一轮 recompile 那个位置自然就变成真块，幻影块自己消失。

// 在 index 块的 above / below 插入一个空块。返回新源码与空块的 1-based 行号。
//
// 插入的做法值得说明：**只往源码里插空行**（空行不构成块，scanner 会跳过），
// 由调用方把一个「幻影块」塞进 blocks（pos 正好覆盖那一行）。
// 这样 makeEditor / applyBlockEdit / 撤销栈全部原样复用 ——
// 不需要给编辑器加第二套写回路径。用户真打出内容后，下一轮 recompile
// 那个位置自然就成了真块，幻影块自己消失。
//
// ⚠️ 空块**上下各要一个空行**，两个都得管。只留一侧会踩一个很隐蔽的坑：
// 两块紧邻时源码是 `甲。\n新的一段`，扫描器会把它们**并成同一个段落块** ——
// 用户的「新块」反过来把下面的内容吞掉了。（这条是写单测时断言失败才发现的。）
//
// 不原地改 blocks：调用方拿到新源码后一定会重编译，重编译会算出全部正确行号。
// 在这里顺手改一遍反而多出一处可能与重编译不一致的地方 —— 那正是上一轮
// 「点错块」bug 的成因。
export function insertBlockAt(src, blocks, index, where) {
  const blk = blocks[index];
  if (!blk) return null;

  const ls = src.split('\n');
  // below：紧跟块末行之后；above：紧贴块首行之前
  const at = where === 'below' ? blk.pos.end : blk.pos.start - 1;
  ls.splice(at, 0, '');
  let line = at + 1;                       // 空块自己要占的那一行

  if (line - 2 >= 0 && ls[line - 2] !== '') { ls.splice(line - 1, 0, ''); line += 1; }
  if (ls[line] !== undefined && ls[line] !== '') ls.splice(line, 0, '');

  return { source: ls.join('\n'), line };
}

// 把第 index 块与相邻块（dir = -1 上 / +1 下）互换位置，返回新源码与
// 「被移动的那一块」移动后的起始行号（调用方据此把光标放回去）。
// 两块之间的空行跟着留在原地，所以换顺序不会把空行搞乱。
// 同样不原地改 blocks —— 见上面 insertBlockAt 的说明。
export function moveBlock(src, blocks, index, dir) {
  const target = blocks[index];
  const other = blocks[index + dir];
  if (!target || !other) return null;

  const upper = dir === 1 ? target : other;   // 行号在前的那块
  const lower = dir === 1 ? other : target;   // 行号在后的那块

  const ls = src.split('\n');
  const upLines = ls.slice(upper.pos.start - 1, upper.pos.end);
  const lowLines = ls.slice(lower.pos.start - 1, lower.pos.end);
  const gap = ls.slice(upper.pos.end, lower.pos.start - 1);   // 两块之间的空行（可能为空）

  const from = upper.pos.start - 1;
  ls.splice(from, lower.pos.end - upper.pos.start + 1, ...lowLines, ...gap, ...upLines);

  // target 的新起始行：下移时它在后面，上移时它在前面
  const line = dir === 1 ? upper.pos.start + lowLines.length + gap.length : upper.pos.start;
  return { source: ls.join('\n'), line };
}

// 拿掉一个空行，并把因此多出来的相邻空行收掉一个（还原成插入之前的样子）。
// 用途：用户点了「插入空块」却一个字都没打就离开了 —— 那一行该还回去，
// 否则反复点几下会攒出一串空行。
// 不是空行则返回 null（调用方据此保留，不能把人家写的内容删了）。
export function removeBlankLine(src, line) {
  const ls = src.split('\n');
  if ((ls[line - 1] || '').trim() !== '') return null;
  ls.splice(line - 1, 1);
  if (ls[line - 2] === '' && ls[line - 1] === '') ls.splice(line - 2, 1);
  return ls.join('\n');
}

// ── 撤销栈（专题 docs/life-elements-spec.md §5.4）
//
// **为什么必须自建**：光标块换态下，每个 textarea 都是一个独立的原生撤销域。
// 于是"在块 A 打字 → 点到块 B 打字 → 回块 A 按 Ctrl+Z"撤销的不是"你上一个动作"；
// 而"插入一个块级骨架"（跨块、会重建 DOM）原生撤销完全无效。
// 结论：全面接管 Ctrl+Z，不用原生撤销——不接管比接管更难理解。
//
// 设计：
//   栈里存**状态序列**（每个状态含 source 与光标所在源码行），cursor 指向当前状态。
//   撤销 = cursor 回退一格，重做 = 前进一格。
//   kind==='type' 的连续输入在 mergeMs 窗口内**覆盖**当前项，所以一次连续打字
//   只留一条记录，撤销回到"这段输入开始之前"——而不是逐字符回退。

export const HISTORY_LIMIT = 100;
export const MERGE_WINDOW_MS = 400;

export function makeHistory(initial) {
  return { entries: [{ snapshot: initial, kind: 'init', at: 0 }], cursor: 0 };
}

export function currentSnapshot(h) {
  return h.entries[h.cursor].snapshot;
}

export function pushHistory(h, snapshot, kind = 'type', at = 0, mergeMs = MERGE_WINDOW_MS) {
  const last = h.entries[h.cursor];

  // 同一段连续打字 → 覆盖当前项（不是新增），撤销时才回到这段输入之前
  if (kind === 'type' && last && last.kind === 'type' && at - last.at <= mergeMs) {
    last.snapshot = snapshot;
    last.at = at;
    return h;
  }

  h.entries.length = h.cursor + 1;   // 新操作砍掉重做分支
  h.entries.push({ snapshot, kind, at });
  if (h.entries.length > HISTORY_LIMIT) h.entries.shift();
  h.cursor = h.entries.length - 1;
  return h;
}

export const canUndo = (h) => h.cursor > 0;
export const canRedo = (h) => h.cursor < h.entries.length - 1;

export function undoHistory(h) {
  if (!canUndo(h)) return null;
  h.cursor -= 1;
  return h.entries[h.cursor].snapshot;
}

export function redoHistory(h) {
  if (!canRedo(h)) return null;
  h.cursor += 1;
  return h.entries[h.cursor].snapshot;
}
