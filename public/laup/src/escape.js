// HTML 字符转义 —— 渲染器与扩展共用的唯一一份。
//
// ⚠️ 它只管**字符**（`& < > " '`），**不看协议**。URL 必须先过 safeUrl()（见 safeUrl.js），
// 再交给它转义。这两件事搞混的后果很具体：`javascript:alert(1)` 会被 esc() 原样放行，
// 因为里面一个需要转义的字符都没有。
//
// 另一个依赖：白名单自检（whitelist.js）用正则扫产物，前提是**正文里的 `<` 一定被转义过**。
// 所以"所有文本都过 esc()"不是风格问题，是自检能成立的条件。

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
}
