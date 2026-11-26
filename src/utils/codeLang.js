// 代码语言声明 + Prism 高亮（wiki 端宿主层）。
// 约定：sample 卡输入区 / 代码格的第一行可写 `[语言]` 声明，如 [cpp] [python] [sample]；
// Laup 核心零依赖只输出转义文本，剥声明行、上色、语言徽标全在这一层
// （与 laup_vue 的 src/lib/codeLang.js 同源；token 配色复用 rich-content.css）。

// Prism core + 全部语法（vendor ESM 版）。⚠️ 不要直接 import 'prismjs/components/*'：
// rolldown 拆 chunk 后组件的裸全局 Prism 引用会先于 core 执行 → ReferenceError → 白屏
// （详见 prismLangs.js / prismShim.js 头注释）
import Prism from './prismLangs.js'

Prism.manual = true

const ALIASES = {
  cplusplus: 'cpp', 'c++': 'cpp', pluspus: 'cpp',
  py: 'python',
  js: 'javascript', node: 'javascript', ts: 'javascript',
  golang: 'go', sh: 'bash', shell: 'bash', zsh: 'bash',
  yml: 'yaml', html: 'markup', xml: 'markup', text: '', txt: '',
}

export function normalizeLang(raw) {
  const l = String(raw || '').trim().toLowerCase()
  if (!/^[a-z0-9+#-]{1,16}$/.test(l)) return ''
  return ALIASES[l] !== undefined ? ALIASES[l] : l
}

// 第一行声明：`[cpp]` 独占一行 → { lang, body }；没有声明 → { lang:'', body:source }
export function parseFirstLineLang(source) {
  const s = String(source ?? '')
  const m = /^\[([a-zA-Z0-9+#-]{1,16})\][ \t]*\r?\n/.exec(s)
  if (!m) return { lang: '', body: s, declLen: 0 }
  return { lang: normalizeLang(m[1]), raw: m[1].toLowerCase(), body: s.slice(m[0].length), declLen: m[0].length }
}

// ---------- 代码格首行声明（Notebook 宿主层语法） ----------
// 代码格的第一行是「声明行」，它决定这一格走哪条渲染路线。声明行不是注释、
// 也不参与高亮 —— 解析时整体剥掉，产物里不留痕。
//     [cpp] / [python] / [js] …  普通代码块：Prism 上色 + 语言徽标
//     [input] / [output]         输入 / 输出对照卡（相邻两格自动并成一张）
//     [input] 下方写 [cpp]        栏内语言由栏内首行的 [lang] 声明决定（v2 起不再用 [input:cpp]）
export const PANE_INPUT = 'input'
export const PANE_OUTPUT = 'output'

// 语言清单：**只列 Prism 里真有语法的**。列出来却不上色，比不列更让人困惑。
// ⚠️ 站点另一套 Prism（assets/richHtml.js 那条链）装了 20+ 种，要补齐得重生成
// prismLangs.js（那个生成脚本没进仓库）—— 在那之前，这里如实反映实际能力。
const LANG_LABELS = [
  ['cpp', 'C++'], ['c', 'C'], ['python', 'Python'], ['javascript', 'JavaScript'],
  ['json', 'JSON'], ['bash', 'Shell'], ['html', 'HTML'], ['css', 'CSS'], ['text', '纯文本'],
]

// 非 Prism 语法、但有专门渲染路线的声明名（不上色，走自己的预览）
const SPECIAL_DECLS = [
  ['lifetree', '生命树'],
]

/** 补全 / 提示用的语言清单。`name` 是写进 `[…]` 的字面量，`label` 是给人看的名字。 */
export function languageOptions() {
  const code = LANG_LABELS
    .filter(([name]) => name === 'text' || Boolean(Prism.languages[normalizeLang(name)]))
    .map(([name, label]) => ({ name, label }))
  return [...code, ...SPECIAL_DECLS.map(([name, label]) => ({ name, label }))]
}

// 认得出是「声明」的名字集：清单里的语言 + 别名表里的键 + 专门渲染路线的名字。
// 不在这张表里的 `[…]` 一律当正文 —— 否则代码里以 `[x]` 开头的一行会被误吃。
const DECLARABLE = new Set([
  ...LANG_LABELS.map(([name]) => name),
  ...Object.keys(ALIASES),
  ...SPECIAL_DECLS.map(([name]) => name),
])

// 声明行的词法：`[名字]` 或 `[名字:参数]`，必须独占第一行（行尾可有可无换行）
const DECL_LINE_RE = /^\[([A-Za-z0-9_+#-]{1,16})(?::([A-Za-z0-9_+#-]{1,16}))?\][ \t]*(?:\r?\n|$)/

/**
 * 解析代码格首行声明。返回：
 *   kind     'lang' | 'input' | 'output' | 'none'
 *   lang     归一化后的 Prism 语言名（'' = 不上色）
 *   raw      声明里原样写的名字（语言徽标回显用）
 *   declText 声明行原文（如 `[cpp]`）
 *   body     剥掉声明行之后的正文
 */
export function parseCodeDecl(source) {
  const text = String(source ?? '')
  const m = DECL_LINE_RE.exec(text)
  if (!m) return { kind: 'none', lang: '', raw: '', declText: '', body: text }
  const name = m[1].toLowerCase()
  const arg = m[2] ? m[2].toLowerCase() : ''
  const declText = arg ? `[${name}:${arg}]` : `[${name}]`
  const body = text.slice(m[0].length)
  if (name === PANE_INPUT || name === PANE_OUTPUT) {
    return { kind: name, lang: arg ? normalizeLang(arg) : '', raw: arg, declText, body }
  }
  return { kind: 'lang', lang: normalizeLang(name), raw: name, declText, body }
}

/** 这一格的声明是否被认得（用于决定要不要把声明行剥掉）。 */
export function isDeclarable(name) {
  return DECLARABLE.has(String(name || '').toLowerCase())
}

/**
 * Notebook 代码格在 .laup 里的围栏语言名。
 *
 * 为什么要有它：代码格落库时要**原样存**（正文一字不改），所以格源码（含首行的
 * `[cpp]` 声明）被整段放进围栏正文，语言名就不写在围栏上了、写在正文首行。
 * 于是它落到下面的 ② 分支 —— 与 sample 卡两栏走同一条剥声明 + 上色。
 *
 * 它只在**宿主层**成立：Laup 核心不认识这个名字，照样按普通代码块产物输出
 * `<pre><code class="language-code">`，这里再把语言改认成首行声明里的那个。
 */
export const CODE_FENCE_LANG = 'code'

/**
 * 给渲染后的 HTML 上色（就地返回新 HTML）：
 * ① 围栏自带语言 `<pre><code class="language-xxx">` → Prism 高亮 + pre 挂 data-code-language
 *    例外：`language-code`（Notebook 代码格）**不上色**，落到 ② 去认首行声明。
 * ② 围栏或对照卡栏内首行的 `[lang]` 声明 → 剥掉声明行 + 高亮 + 徽标
 *    （徽标由 CSS 的 pre[data-code-language]::before 出：rich-content.css / notebook.css）
 * 同一条分支同时服务「普通代码围栏」「代码格围栏」和「sample 卡的两栏」—— 形状相同，处理就相同。
 * 失败原样返回，绝不抛错。
 */
export function highlightLaupCode(html) {
  if (!html || !html.includes('<code')) return html
  try {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

    // 给一个代码容器上色：挂 data-code-language（徽标由 CSS 的 ::before 出）+ Prism 高亮
    function colorize(code, lang, text) {
      code.className = `language-${lang}`
      code.closest('pre')?.setAttribute('data-code-language', lang)
      const grammar = Prism.languages[lang]
      if (grammar) code.innerHTML = Prism.highlight(text, grammar, lang)
      else code.textContent = text
      // 逐行包一层：PDF 分页要能按行断页（LaTeX 的 \clearpage 也只会断在行间）
      wrapCodeLines(code)
    }

    /** 逐行包一层 <span class="ln">：PDF 分页才能断在行间（LaTeX 也只会在行间断页）。 */
    const escHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    function wrapCodeLines(code) {
      const lines = []
      const pushLine = () => { lines.push([]) }
      const walk = (node, carryOpen) => {
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === 3) {
            const parts = (child.nodeValue || '').split('\n')
            parts.forEach((part, i) => {
              if (i) { closeAll(carryOpen); pushLine(); reopen(carryOpen) }
              if (part) lines[lines.length - 1].push(escHtml(part))
            })
          } else if (child.nodeType === 1) {
            const open = `<span class="${child.className || ''}">`
            lines[lines.length - 1].push(open)
            walk(child, [...carryOpen, open])
            lines[lines.length - 1].push('</span>')
          }
        }
      }
      const closeAll = (stack) => { for (let i = stack.length - 1; i >= 0; i -= 1) lines[lines.length - 1].push('</span>') }
      const reopen = (stack) => { for (const open of stack) lines[lines.length - 1].push(open) }
      pushLine()
      walk(code, [])
      code.innerHTML = lines.map((parts) => `<span class="ln nb-ln">${parts.join('') || ' '}</span>`).join('')
    }

    for (const code of doc.body.querySelectorAll('pre > code')) {
      const source = code.textContent || ''

      // ① 围栏自带语言：```cpp → <code class="language-cpp">
      //    ⚠️ ` ```code ` 是代码格的载体：围栏上那个 "code" 不是语言，语言在正文首行的
      //    `[lang]` 里 —— 所以不能在这里 continue，要落下去走 ②。
      const cls = [...code.classList].find((c) => c.startsWith('language-'))
      if (cls) {
        const lang = normalizeLang(cls.slice('language-'.length))
        if (lang !== CODE_FENCE_LANG) {
          if (lang) colorize(code, lang, source)
          continue
        }
      }

      // ② 首行声明：围栏里第一行写 `[cpp]`。对照卡的两栏也是 `pre > code`，
      //    所以输入栏首行的 `[lang]` 走的是同一条 —— 一份实现，两处受益。
      const { kind, lang, raw, body } = parseCodeDecl(source)
      if (kind !== 'lang' || !isDeclarable(raw)) continue
      // 声明认得但该语言没语法（如 [yml]）→ 只剥掉声明行，不上色
      if (lang) colorize(code, lang, body)
      else { code.textContent = body; wrapCodeLines(code) }
    }

    return doc.body.innerHTML
  } catch {
    return html
  }
}
