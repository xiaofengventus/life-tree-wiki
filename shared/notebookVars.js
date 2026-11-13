// Notebook 宿主层的「变量」纯函数 —— 客户端与服务端共用。
//
// ── 为什么必须抽成一个文件
//   变量的解析与插值在两个运行时都要用：
//     客户端  src/notebook/renderer.js（编辑、预览、导出）
//     服务端  server/laup.js        （发布时重渲）
//   两边只要有一处口径不同，症状就是「编辑器里好好的、发出来变个样」，
//   而且极难查。所以这里放**唯一一份**实现。
//
// ── 为什么这里一个 import 都没有
//   renderer.js 那条链上有 DOMPurify（要 window），服务端不能碰。
//   这个文件必须能在 Node 里裸跑，所以只许写纯字符串处理。
//
// ── 变量为什么要进 .laup（而不是导出时内联）
//   `.laup` 曾经导出的是「内联后的快照」：{{title}} 被替换成字面值，var 格整格丢掉。
//   那样发布是对的（读者不需要变量），但**回不来** —— 专栏「编辑」是把
//   content_laup 重新 parseLaupDoc 成格，于是 var 格消失、正文里的占位符也没了，
//   变量格即便补回去也改不动正文（孤儿）。
//   现在改成：变量定义随文档走（零输出的 \varcell 数据块），正文保留 {{name}}，
//   由渲染方（客户端预览 / 服务端发布）各自解析。导出、导入、编辑三条路全部无损。

/** 变量格在 .laup 里的数据块名（零输出，见 src/laup/extensions/life.js 的同名条目）。 */
export const VARCELL = 'varcell'

// ---------- 变量求值：字符串 / 数字 / true·false / JSON，其余按原样字符串 ----------
export function evalValue(raw) {
  const v = String(raw ?? '').trim()
  // 引号必须成对（≥2 字符）：单独一个 " 是多行字符串的开头，不能在这里截断
  if (/^(["'])([\s\S]+)\1$/.test(v)) return v.slice(1, -1)
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  if (v === 'true') return true
  if (v === 'false') return false
  try { return JSON.parse(v.replace(/,(\s*[}\]])/g, '$1')) } catch { return v }
}

// ---------- var 语句读取（支持多行） ----------
// 一条声明 = `var name = value`，var 格内也允许裸赋值 `name = value`。
// value 形态：
//   "…"/'…'                单行字符串（行尾 ; 可省）
//   """…"""                多行字符串（三引号，推荐给代码 / 含引号的长文本）
//   "… / '… 行内未闭合      多行字符串：延续到出现闭合引号的那一行（直觉写法）
//   [ … ] / { … }          JSON，可跨行（自动吞行到括号配平）
//   数字 / true / false     字面量；其他内容按原样字符串
// 另：整行以 // 或 # 开头是注释行（由 collectVars 跳过）；
//     refs[N]="…" 形态由全局文献池处理，本解析器天然不匹配（带 [N]）。
// 已知限制：字符串里出现与开头相同的引号会被当作闭合——含引号的代码请用 """ 三引号。
function bracketBalance(s) {
  let bal = 0, q = null
  for (let k = 0; k < s.length; k++) {
    const ch = s[k]
    if (q) { if (ch === q) q = null; continue }
    if (ch === '"' || ch === "'") { q = ch; continue }
    if (ch === '[' || ch === '{') bal++
    else if (ch === ']' || ch === '}') bal--
  }
  return bal
}

// 从 lines[i] 读一条声明；成功返回 { name, value, end }（end = 继续解析的行号），失败 null
export function readVarStatement(lines, i) {
  const m = String(lines[i] ?? '').match(/^[ \t]*(?:var[ \t]+)?([A-Za-z_]\w*)[ \t]*=[ \t]*(.*)$/)
  if (!m) return null
  const name = m[1]
  const rest = m[2]
  // 三引号 / 单引号共用的多行吞行逻辑：
  //   首行尾部为空（引号后直接换行）不收集，避免开头空行；
  //   闭合行前缀仅在非空时收集，避免结尾空行；中间空行原样保留
  const multiline = (firstTail, findClose) => {
    const parts = []
    let e = findClose(firstTail)
    if (e >= 0) return { value: firstTail.slice(0, e), end: i + 1 }
    if (firstTail) parts.push(firstTail)
    let j = i + 1
    while (j < lines.length) {
      const body = lines[j]
      e = findClose(body)
      if (e >= 0) {
        const pre = body.slice(0, e)
        if (pre) parts.push(pre)
        return { value: parts.join('\n'), end: j + 1 }
      }
      parts.push(body)
      j++
    }
    return { value: parts.join('\n'), end: lines.length }
  }

  if (rest.startsWith('"""')) {
    const { value, end } = multiline(rest.slice(3), (b) => b.indexOf('"""'))
    return { name, value, end }
  }
  const q = rest[0]
  if (q === '"' || q === "'") {
    // 行内闭合（允许尾随 ;）
    const stripped = rest.replace(/[ \t]*;[ \t]*$/, '')
    if (/^"[\s\S]*"$|^'[\s\S]*'$/.test(stripped)) return { name, value: stripped.slice(1, -1), end: i + 1 }
    // 行内未闭合 → 多行，延续到出现闭合引号的那一行
    const { value, end } = multiline(rest.slice(1), (b) => b.lastIndexOf(q))
    return { name, value, end }
  }
  if (rest.startsWith('[') || rest.startsWith('{')) {
    let acc = rest
    let j = i
    while (bracketBalance(acc) > 0 && j + 1 < lines.length) { j++; acc += '\n' + lines[j] }
    return { name, value: evalValue(acc), end: j + 1 }
  }
  return { name, value: evalValue(rest.replace(/[ \t]*;[ \t]*$/, '')), end: i + 1 }
}

// 从 var 格源码收集变量（返回 [ [name, value], ... ]，按出现顺序）
export function collectVars(source) {
  const out = []
  const lines = String(source ?? '').split('\n')
  let i = 0
  while (i < lines.length) {
    const t = lines[i].trim()
    if (!t || t.startsWith('//') || t.startsWith('#')) { i++; continue }
    const st = readVarStatement(lines, i)
    if (st) { out.push([st.name, st.value]); i = st.end; continue }
    i++
  }
  return out
}

// ---------- {{name}} 插值 ----------
/**
 * 把正文里的 `{{name}}` 换成作用域里的值；未定义的**原样保留**（不是替换成空，
 * 否则作者会以为变量没定义是"渲染成空了"）。
 * @param mapValue 可选。客户端用它把「值为 data URL」的变量换成附件占位路径
 *                 （Laup 的 safeUrl 有意拦 data:，渲染完再由宿主换回去）；
 *                 服务端不传，直接取 String(v)。
 */
export function interpolateVars(src, scope, mapValue) {
  const text = String(src ?? '')
  if (!scope) return text
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => {
    if (!(k in scope)) return m
    const v = scope[k]
    if (mapValue) return mapValue(k, v)
    return String(v)
  })
}

// ---------- \varcell=[ … ] 数据块的读写 ----------
// 形态：位置型数据块，**一行一个字符串元素**，每个元素是变量格源码的一行。
//     \varcell=[
//         "var title = \"示例\""
//         "var year = 2026"
//     ]
// 为什么按行拆：整格塞成一个字符串也能用，但那样 `\n` 全变成转义符，diff 与 grep
// 都看不成；按行拆之后逐行可读、可搜、可diff。代价是每行要转义 `\` 与 `"`。
// ⚠️ 转义必须与 Laup 核心的 readQuoted 逐字对齐（`\` → `\\`、`"` → `\"`、
//    `\n` → 换行）—— 这个块最终由 Laup 的解析器读，口径不同就会静默错位。

const VAR_BLOCK_START = new RegExp(`^[ \\t]*\\\\${VARCELL}[ \\t]*=[ \\t]*\\[[ \\t]*$`)

const escLine = (line) => String(line).replace(/\\/g, '\\\\').replace(/"/g, '\\"')

/** 变量格源码 → `\varcell=[ … ]` 块文本。空源码返回 ''（空格不进产物）。 */
export function varBlockText(source) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').replace(/\s+$/, '').split('\n')
  if (!lines.length || (lines.length === 1 && !lines[0])) return ''
  return [`\\${VARCELL}=[`, ...lines.map((l) => `    "${escLine(l)}"`), ']'].join('\n')
}

// 读一行位置型元素。**镜像 Laup 核心的 readQuoted**：返回 null = 这一行不是合法元素
// （没引号 / 没闭合 / 一行写了多个）。判定必须一致，否则同一个块两边读出的东西不同。
function readQuotedLine(t) {
  const q = t[0]
  if (q !== '"' && q !== "'") return null
  let out = ''
  for (let k = 1; k < t.length; k++) {
    const c = t[k]
    if (c === '\\') {
      const nx = t[k + 1]
      if (nx === q || nx === '\\') { out += nx; k++; continue }
      if (nx === 'n') { out += '\n'; k++; continue }
      out += c
      continue
    }
    if (c === q) return k === t.length - 1 ? out : null
    out += c
  }
  return null
}

/**
 * 从 lines[i] 起读一个 `\varcell=[ … ]` 块。
 * 返回 { source, next, lineCount } 或 null（不是块 / 没闭合 / 内容不是字符串元素）。
 * ⚠️ 任何一处不合法都返回 null 而不是抛错 —— 调用方会把它当普通正文继续走，
 *    这样"作者在 laup 格里手写了 \varcell"的极端情况不会整篇渲染失败。
 */
export function readVarBlock(lines, i) {
  const src = Array.isArray(lines) ? lines : []
  if (!VAR_BLOCK_START.test(String(src[i] ?? ''))) return null
  const out = []
  for (let j = i + 1; j < src.length; j++) {
    const t = String(src[j]).trim()
    if (t === ']') return { source: out.join('\n') + '\n', next: j + 1, lineCount: j + 1 - i }
    const one = readQuotedLine(t)
    if (one === null) return null
    out.push(one)
  }
  return null
}

/**
 * 服务端用：扫出整篇 .laup 里的所有变量定义 → 一份作用域，**并返回把块挖空后的文本**。
 * 挖空而不是删除，是为了**保住行号** —— 渲染报错的行号仍然指得准。
 * 为什么插值必须绕开块本身：块里是变量定义原文，对定义再插一遍会把
 * `var a = "{{b}}"` 这种写法弄歪（作者要的显然是把字面量 {{b}} 存进去）。
 */
export function extractVarScope(text) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n')
  const scope = {}
  const kept = []
  let i = 0
  while (i < lines.length) {
    const block = readVarBlock(lines, i)
    if (!block) { kept.push(lines[i]); i++; continue }
    for (const [k, v] of collectVars(block.source)) scope[k] = v
    kept.push(...new Array(block.lineCount).fill(''))
    i = block.next
  }
  return { scope, text: kept.join('\n') }
}
