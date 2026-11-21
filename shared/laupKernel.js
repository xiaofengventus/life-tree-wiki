// 判断一份 `.laup` 文档由哪套内核（v1 / v2）读写。
//
// v1 与 v2 已经独立：同一份源码只按一种口径解析，不做翻译。
// 服务端发布与阅读页要靠这个函数选内核，否则 v1 存量文章会被 v2 报错。
//
// 判定只看 **v1 宿主层独有的写法**；v2 的格标记（[input] / [output] / [cpp] /
// [var] / [references]）在两边长得一样，不能当依据。
// `[input:cpp]` 不算 v1 依据：它是 v2 里应当报错的写法，交给 v2 自己拒掉，
// 否则一份纯 v2 文档会因为它被误判成 v1。

const V1_MARKERS = [
  [/^[ \t]*\\varcell[ \t]*=[ \t]*\[/m, "varcell"],
  [/^[ \t]*\\references[ \t]*=[ \t]*\[/m, "references 数据块"],
  [/^[ \t]*\\tree[ \t]*=[ \t]*\[/m, "tree 数据块"],
  [/^[ \t]*\\image[ \t]*[!=]/m, "image 数据块"],
  [/^[ \t]{0,3}`{3,}[ \t]*code\b/m, "```code 围栏"],
  [/^[ \t]{0,3}`{3,}[ \t]*sample\b/m, "```sample 围栏"],
  [/^[ \t]{0,3}`{3,}[ \t]*lifetree\b/m, "```lifetree 围栏"],
];

/**
 * @param {string} source
 * @returns {'v1' | 'v2'}
 */
export function detectLaupKernel(source) {
  const text = String(source ?? "");
  for (const [pattern] of V1_MARKERS) {
    if (pattern.test(text)) return "v1";
  }
  return "v2";
}
