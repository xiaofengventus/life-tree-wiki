// URL 出口的唯一收口。
//
// ── 为什么必须有这个文件（实测出来的洞，不是假想）
//   渲染器给 href / src 赋值时只做了 `esc()` —— 而 esc 只管**字符**转义
//   （& < > " '），**完全不看 URL 的协议**。于是：
//       [点我](javascript:alert(1))
//   会原样渲染成
//       <a href="javascript:alert(1">点我</a>
//   在阅读端就是一个**可点的 javascript: 链接** —— 点下去在页面自己的 origin 里执行脚本。
//   作者写在自己草稿里是自伤，一旦发布出去就是"作者对读者"的存储型 XSS。
//   `data:` / `vbscript:` 同理；协议相对地址 `//evil.example` 等于偷偷换了 host。
//
// ── 为什么修在 Laup 里，而不是靠下游的清洗白名单
//   下游（比如某个站点的 sanitizePostHtml）确实也能拦掉 —— 但那是**别人的规矩**。
//   Laup 的产物在任何宿主里都应该是干净的：自己产出的 HTML 自己保证安全，
//   下游要不要再检一遍是下游的事。这也是"阅读端/编辑器不跟外部编辑器耦合"的前提：
//   不耦合，就没有别人替你兜底。
//
// ── 策略
//   放行：http: / https: / mailto:（可选）、`#锚点`、相对路径（`/a/b`、`./a`、`a.png`）
//   拒绝：一切其它协议（javascript: / data: / vbscript: / file: / blob: …）
//         以及协议相对地址 `//host`（它继承当前页协议，等于一次隐式跳站）
//   返回空字符串表示"不合法"，由调用方决定怎么降级（见 renderHtml.js）。

// mailto: 对链接合理，对 <img src> 没意义 —— 用 kinds 区分。
const LINK_SCHEMES = new Set(['http', 'https', 'mailto']);
const IMAGE_SCHEMES = new Set(['http', 'https']);

// 去掉 C0/C1 控制字符与所有空白后再判协议。
// 这一步不能省：`java\tscript:alert(1)` / `java\nscript:` 在浏览器里仍会被当成 javascript:，
// 但正则 `^javascript:` 是匹配不到的 —— 先清洗再判，才不会被这种写法绕过。
function normalize(value) {
  return String(value ?? "").replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
}

export function safeUrl(raw, { kind = 'link' } = {}) {
  // 只接字符串。不做 `String(raw)` 强转 —— 否则 `{}` 会变成 `"[object Object]"`
  // 被当成一条相对路径放行，等于把"类型写错"伪装成"地址合法"。
  if (typeof raw !== 'string') return '';
  const value = normalize(raw);
  if (!value) return '';

  // 站内锚点：只认 `#` 开头。
  // 形状**不收紧**：`#` 之后的一切都只是 fragment（浏览器拿去做 id 匹配），
  // 协议在 `#` 之前就已经定死了，所以这里不存在"被当成 javascript: 执行"的余地。
  // 头一版把字符集收成 [A-Za-z0-9._~!-\u4e00-\u9fa5]，结果把真实标题里的 `①`
  // （U+2460，不在汉字区）判成了非法 —— 锚点被误伤，白名单自检立刻炸出来。
  // 只挡会破坏属性本身的字符：引号、空白、尖括号。
  if (value.startsWith('#')) {
    return /^#[^"'\s<>]*$/.test(value) ? value : '';
  }

  // 协议相对：`//evil.example/x`。看起来像路径，实际是一次跳站 —— 拒。
  if (value.startsWith('//')) return '';

  const schemeMatch = value.match(/^([A-Za-z][A-Za-z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    const allowed = kind === 'image' ? IMAGE_SCHEMES : LINK_SCHEMES;
    return allowed.has(scheme) ? value : '';
  }

  // 相对路径（含 `/abs`、`./rel`、`a.png`）。没有协议就是同源请求，安全。
  // 但反斜杠要挡一下：`\\/\\/evil.example` 在部分浏览器里会被规范化成 `//evil.example`。
  if (value.startsWith('\\')) return '';
  return value;
}

export function isSafeUrl(raw, options) {
  return safeUrl(raw, options) !== '';
}
