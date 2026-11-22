// 判断一份 `.laup` 文档由哪套内核（v1 / v2）读写。
//
// v1 与 v2 已经独立：同一份源码只按一种口径解析，不做翻译。
// 服务端发布与阅读页要靠这个函数选内核，否则 v1 存量文章会被 v2 报错。
//
// 判定只看 **v1 宿主层独有的写法**；v2 的格标记（[input] / [output] / [cpp] /
// [var] / [references]）在两边长得一样，不能当依据。
// `[input:cpp]` 不算 v1 依据：它是 v2 里应当报错的写法，交给 v2 自己拒掉，
// 否则一份纯 v2 文档会因为它被误判成 v1。

const DATA_BLOCK_MARKERS = [
  [/^[ \t]*\\varcell[ \t]*=[ \t]*\[/m, "varcell"],
  [/^[ \t]*\\references[ \t]*=[ \t]*\[/m, "references 数据块"],
  [/^[ \t]*\\tree[ \t]*=[ \t]*\[/m, "tree 数据块"],
  [/^[ \t]*\\image[ \t]*[!=]/m, "image 数据块"],
];

/** v1 独有的围栏语言（围栏首行的 info 字符串） */
const V1_FENCES = ["code", "sample", "lifetree"];

// raw 环境里的内容不解析命令，写什么都只是正文（示例/讲解）
const RAW_ENV_RE = /\\begin\{(stay|equation|todo|card|tree|sample)\}[\s\S]*?\\end\{\1\}/g;

/**
 * 只剥掉「仅作为示例出现」的源码区域，供各类源码扫描共用：
 *   · 围栏代码块：整块内容丢弃，只记下 info 字符串（围栏本身也是语法）
 *   · 行内代码：内容丢弃
 *   · raw 环境（stay / equation / todo / card / tree / sample）：正文丢弃
 *
 * `visible` 保留原来的行数（用空行占位），行号仍然对得上。
 *
 * @param {string} source
 * @returns {{ visible: string, fences: string[] }}
 */
export function scanLaupSource(source) {
  const lines = String(source ?? "").split("\n");
  const kept = [];
  const fences = [];
  let fence = null;
  for (const line of lines) {
    const open = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*(.*)$/.exec(line);
    const close = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
    if (fence) {
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
      kept.push("");
      continue;
    }
    if (open) {
      fence = open[1];
      fences.push(open[2].trim());
      kept.push("");
      continue;
    }
    kept.push(line.replace(/`[^`\n]*`/g, ""));
  }
  const visible = kept.join("\n").replace(RAW_ENV_RE, (match) => match.replace(/[^\n]/g, ""));
  return { visible, fences };
}

/**
 * @param {string} source
 * @returns {'v1' | 'v2'}
 */
export function detectLaupKernel(source) {
  const { visible, fences } = scanLaupSource(source);
  for (const [pattern] of DATA_BLOCK_MARKERS) {
    if (pattern.test(visible)) return "v1";
  }
  for (const info of fences) {
    const tag = /^([A-Za-z][A-Za-z0-9-]*)/.exec(info);
    if (tag && V1_FENCES.includes(tag[1].toLowerCase())) return "v1";
  }
  return "v2";
}
