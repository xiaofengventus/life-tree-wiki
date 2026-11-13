// 行级 diff（LCS 动态规划）—— 版本历史「红绿对比」的核心。
// 文章源码都在几百行级，O(n·m) 的 DP 完全够用；超限则退化为整删整增。
const MAX_CELLS = 4_000_000; // 4000 行 × 1000 行的安全边界

export function diffLines(oldText, newText) {
  const a = String(oldText ?? "").split("\n");
  const b = String(newText ?? "").split("\n");
  const n = a.length;
  const m = b.length;
  if (n * m > MAX_CELLS) {
    return [
      ...a.map((text) => ({ type: "del", text })),
      ...b.map((text) => ({ type: "add", text })),
    ];
  }
  // dp[i][j] = a[i..] 与 b[j..] 的最长公共子序列长度
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "del", text: a[i] });
      i += 1;
    } else {
      rows.push({ type: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    rows.push({ type: "del", text: a[i] });
    i += 1;
  }
  while (j < m) {
    rows.push({ type: "add", text: b[j] });
    j += 1;
  }
  return rows;
}

// 折叠长段未变化的行：连续 same 超过阈值时只留首尾几行，中间换成 skip 标记。
// 返回 [{ type: 'same'|'add'|'del', text }, { type: 'skip', text: '… 跳过 N 行相同内容 …' }, ...]
export function collapseSame(rows, { keep = 2, threshold = 6 } = {}) {
  const output = [];
  let run = [];
  const flushRun = () => {
    if (!run.length) return;
    if (run.length <= threshold) {
      output.push(...run);
    } else {
      output.push(...run.slice(0, keep));
      output.push({ type: "skip", text: `…… 跳过 ${run.length - keep * 2} 行未变化 ……` });
      output.push(...run.slice(run.length - keep));
    }
    run = [];
  };
  for (const row of rows) {
    if (row.type === "same") run.push(row);
    else {
      flushRun();
      output.push(row);
    }
  }
  flushRun();
  return output;
}
