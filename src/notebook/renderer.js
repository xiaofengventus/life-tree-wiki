// Notebook 宿主层渲染管线：
//   cell.source → ① 剥 import "laup" → ② attachment:/dataURL → 占位路径
//              → ③ {{var}} 插值 → ④ Laup 核心 compile/render（零改动）
//              → ⑤ 占位符还原为 data URL
// 变量与附件都活在这一层，laup 核心规范 §13（不做变量/模板）未被触碰。

import { render, defineExtension, listExtensions } from '@/laup/core/index.js'
import { lifeElements, PACK_NAME } from '@/laup/extensions/life.js'
import {
  lifesequence, PACK_NAME as LIFETREE_PACK,
  parseLifetree, LIFETREE_LANG,
} from '@/laup/extensions/lifetree.js'
import DOMPurify from 'dompurify'
import {
  CODE_FENCE_LANG, highlightLaupCode, isDeclarable, languageOptions, parseCodeDecl, PANE_INPUT, PANE_OUTPUT,
} from '@/utils/codeLang.js'
import { parseCodeSampleText } from '@/utils/codeSample.js'
import {
  collectVars, interpolateVars, readVarBlock, readVarStatement,
} from '../../shared/notebookVars.js'
import { computeLifeTreeLayout } from '@/utils/lifeTreeLayout.js'
// v2 内核：阅读面与服务端发布共用同一套渲染器；内核按文档写法判定，不做跨版本翻译
import { detectLaupKernel } from '../../shared/laupKernel.js'
import { typesetCells } from '../laup2/index.js'

// 站点扩展装载：与旧版 laup 写作页共用同一份 life 扩展包。
// 模块加载时装一次；每次渲染前再兜底检查 —— 旧编辑器若先 uninstall 了，
// 这里能在下一次运行格时自动补装，两个模块互不拖垮。
function ensureLifeExtension() {
  if (!listExtensions().includes(PACK_NAME)) {
    defineExtension(lifeElements({ treeRoute: (id) => `/life-tree/${id}` }))
  }
  // Lifeseqence：[lifetree] 格 / ```lifetree 围栏的解析与渲染（发布走同一份扩展）
  if (!listExtensions().includes(LIFETREE_PACK)) {
    defineExtension(lifesequence())
  }
}
ensureLifeExtension()

// ---------- 输出消毒（防恶意内容） ----------
// 任何 laup 格输出进 v-html 前都过 DOMPurify：
//   - <script>、on* 事件属性、javascript: 链接一律剥除（含 \raw{} 里的内容）
//   - data-tex / class 保留（KaTeX 排版与样式需要）
//   - img 的 data:image URI 放行（附件/粘贴图片的存储形态），其余 data: 拒绝
const PURIFY_CFG = {
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$)|data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,)/i,
}
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, PURIFY_CFG)
}

// ---------- 变量：解析与插值的唯一实现在 shared/notebookVars.js ----------
// 客户端（这里）与服务端（server/laup.js 发布时重渲）必须逐字同口径，
// 所以那段纯函数抽出去两边共用了。本文件只按需引用，不再自带一份。

// ---------- 预处理 ----------
// attachment 不直接替换成 data URL —— Laup 核心的 safeUrl 有意拦截 data: 协议
// （防存储型 XSS，见 Laup/src/safeUrl.js）。所以走两步：
//   预处理：attachment:name → 安全占位相对路径 `__laup_att_<i>.png`（能过 safeUrl）
//   后处理：编译产物里把占位 src 替换回 data URL（宿主自己负责，核心零改动）
const ATT_RE = /attachment:([\w.\-\u4e00-\u9fa5]+)/g
const attToken = (i) => `__laup_att_${i}.png`

// opts.interpolate === false：只做「附件 → 占位路径 → data URL」的搬运，**不做变量插值**。
// 导出 .laup 用的就是这一档 —— 正文里的 {{name}} 必须原样留着，变量定义随文档走
// （见 exportLaupDoc），否则回编辑时正文已被换成字面值、变量格反成了改不动东西的孤儿。
export function preprocess(source, cell, scope, opts = {}) {
  let s = source
  const atts = []
  // ① 声明行：import "laup" / import Lifeseqence / … 都是宿主层特性开关，编译前全部剥掉。
  //    剥除后留一个空行，避免把后面的 \references=[ 粘成上一行的段落续行（数据块失效）
  s = s.replace(/^[ \t]*import(?:\s+["'][^"']+["']|\s+[A-Za-z][\w-]*)[ \t]*$/gm, '')
  // ①″ 粘连修复：手机端连续插图时，`]`、`#` 等前文可能和 \image 块挤在同一行
  //     （数据块要求 ] 与 \image= 各占一行；粘连时核心解析失败，整块按字面量输出，
  //     实测症状：⚠ 未知命令 \image）。把行中间出现的 \image![ / \image=[ 拆到新行。
  //     只在代码围栏外处理，避免破坏示例代码里的字面文本。
  {
    const ls = s.split('\n')
    let fence = false
    for (let idx = 0; idx < ls.length; idx++) {
      if (/^[ \t]*```/.test(ls[idx])) { fence = !fence; continue }
      if (fence) continue
      // 拆出空行（不只是换行）：数据块必须处在"顶级位置"（前面有空行/块边界），
      // 否则核心会把 \image=[ 当成上一行（如 # 标题）的段落续行，按字面量输出
      ls[idx] = ls[idx].replace(/(\S)[ \t]*(\\image[!=])/g, '$1\n\n$2')
    }
    s = ls.join('\n')
    // 第二遍：保证 \image 块前有空行 —— 简写展开 / 旧文档里块紧跟正文行（无空行）
    // 时核心不识别（实测 0 figure，无警告静默丢图）。标题行后也统一补空行，无害。
    const ls2 = s.split('\n')
    const out2 = []
    let fence2 = false
    for (const ln of ls2) {
      if (/^[ \t]*```/.test(ln)) { fence2 = !fence2; out2.push(ln); continue }
      if (fence2) { out2.push(ln); continue }
      if (/^[ \t]*\\image[!=]/.test(ln) && out2.length && out2[out2.length - 1].trim() !== '') out2.push('')
      out2.push(ln)
    }
    s = out2.join('\n')
  }
  // ①′ 图片简写 → 规范 \image=[ … ] 块（语法糖，宿主层展开，核心零改动）：
  //    \image![alt](src){caption}   caption 可含一层嵌套花括号（如 \cite{1}）
  //    独占一行生效；导出 .laup 时同样被展开成规范形式
  s = s.replace(/^[ \t]*\\image![ \t]*\[([^\]]*)\][ \t]*\(([^)]*)\)[ \t]*\{((?:[^{}]|\{[^{}]*\})*)\}[ \t]*$/gm,
    (m, alt, src, cap) => {
      const q = (v) => String(v).trim().replace(/"/g, '\\"')
      return '\\image=[\n'
        + `    src="${q(src)}"\n`
        + `    alt="${q(alt)}"\n`
        + `    caption="${q(cap)}"\n`
        + ']'
    })
  // ② 附件：换成占位路径，data URL 收进 atts 留给后处理
  s = s.replace(ATT_RE, (m, name) => {
    const url = cell?.attachments?.[name]
    if (!url) return m
    atts.push(url)
    return attToken(atts.length - 1)
  })
  // ③ 变量插值：值为 data URL（var 存图 / 粘贴注入）同样走占位符，未定义的保持原样。
  //    口径抽在 shared/notebookVars.js —— 服务端发布时用同一份实现（那边不传 mapValue）
  if (opts.interpolate !== false) {
    s = interpolateVars(s, scope, (k, v) => {
      if (typeof v === 'string' && v.startsWith('data:')) {
        atts.push(v)
        return attToken(atts.length - 1)
      }
      return String(v)
    })
  }
  return { src: s, atts }
}

// 后处理：把编译产物里的占位 src 换回 data URL（base64 无引号，直接替换安全）
export function restoreAttachments(html, atts) {
  return html.replace(/__laup_att_(\d+)\.png/g, (m, i) => atts[+i] ?? m)
}

// ---------- 全局文献池 ----------
// \references 语义上是"一篇文档一个列表"，但 Notebook 每格独立编译，
// \cite 跨格就找不到条目（refs 共 0 条）。宿主补齐语义：
//   汇总：把所有 laup 格的 \references 块按格顺序汇成全局池
//   注入：只有 \cite、没有自家 \references 的格，编译前把池追加到源码
//   剥除：编译后把注入产生的文献节剥掉（只留 \cite 上标）——
//        编号全局一致，列表只在声明它的格渲染
// 全局文献池的三个操作：
//   collect：从源码里收集 \references 原始块（未闭合到格尾也收）
//   strip ：把源码里的 \references 块剥掉（条目已上交全局池，避免编译时重复）
//   merge ：把收集到的块按顺序合并成一个全局 \references 块（条目顺序 = 全局编号）
export function collectRefBlocks(source) {
  const blocks = []
  let buf = null
  for (const line of String(source).split('\n')) {
    if (buf === null) {
      if (/^\s*\\references=\[/.test(line)) buf = [line]
    } else {
      buf.push(line)
      if (/^\s*\]\s*$/.test(line)) { blocks.push(buf.join('\n')); buf = null }
    }
  }
  // 块到格尾还没遇到独立成行的 ]：照样收集（编译器对未闭合块有自己的报错，
  // 但收集层面不能因收尾格式而漏掉整块，否则其他格的 \cite 全部失效）
  if (buf !== null && buf.some((l) => l.trim())) blocks.push(buf.join('\n'))
  return blocks
}

export function stripRefBlocks(source) {
  const out = []
  let inBlock = false
  for (const line of String(source).split('\n')) {
    if (!inBlock) {
      if (/^\s*\\references=\[/.test(line)) inBlock = true
      else out.push(line)
      continue
    }
    if (/^\s*\]\s*$/.test(line)) inBlock = false
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n')
}

export function mergeRefBlocks(entries) {
  if (!entries.length) return ''
  return '\\references=[\n' + entries.map((t) => `    "${String(t).replace(/"/g, "'")}"`).join('\n') + '\n]'
}

// ---------- 全局文献数组 ----------
// 两种写法汇入同一个全局数组（条目顺序 = 全局编号，\cite{N} 全笔记本解析）：
//   ① laup 格的 \references=[…] 位置型块：条目按出现顺序填入空槽
//   ② var 格的显式编号声明（用户提案的数组写法）：
//        var \reference refs;
//        refs[1] = "nature"
//        refs[3] = "Darwin C. 1859"     ← 直接钉死第 3 号槽位，可跳号、可覆盖
// 中间空槽自动补占位条目，保证编号与 \cite{N} 严格对齐。
// 声明行宽容匹配（全部等价，推荐第一种）：
//   reference refs        reference::refs       reference::var refs
//   var \reference refs;  \reference refs;
const REF_DECL_RE = /^[ \t]*(?:var[ \t]+)?\\?reference(?:::var)?[ \t]*(?:::)?[ \t]*([A-Za-z_]\w*)[ \t]*;?[ \t]*$/i
const REF_IDX_RE = /^[ \t]*([A-Za-z_]\w*)\[([1-9]\d*)\][ \t]*=[ \t]*(.+?)[ \t]*;?[ \t]*$/

function stripQuotes(s) {
  const m = /^["'](.*)["']$/.exec(s.trim())
  return m ? m[1] : s.trim()
}

export function buildRefPool(cells) {
  const slots = [] // slots[i] = 第 i+1 条的内容
  let cursor = 0 // 位置型条目的写指针（跳过已被显式编号占用的槽）
  for (const c of cells) {
    if (c.type === 'laup') {
      for (const block of collectRefBlocks(c.source)) {
        for (const l of block.split('\n').slice(1)) {
          if (/^\s*\]\s*$/.test(l)) break
          if (!l.trim()) continue
          while (slots[cursor] !== undefined) cursor++
          slots[cursor++] = stripQuotes(l)
        }
      }
    } else if (c.type === 'var') {
      let declared = null
      for (const line of c.source.split('\n')) {
        const d = REF_DECL_RE.exec(line)
        if (d) { declared = d[1]; continue }
        if (!declared) continue
        const m = REF_IDX_RE.exec(line)
        if (m && m[1] === declared) slots[Number(m[2]) - 1] = stripQuotes(m[3])
      }
    }
  }
  if (!slots.length) return []
  return slots.map((t, i) => t ?? `（未定义的文献条目 ${i + 1}）`)
}

// 是否有格声明了文献（决定全局列表显示在哪个格：第一个声明格）
export function cellDeclaresRefs(cell) {
  if (!cell) return false
  if (cell.type === 'laup') return collectRefBlocks(cell.source).length > 0
  if (cell.type === 'var') return cell.source.split('\n').some((l) => REF_DECL_RE.test(l))
  return false
}

// 全文被引用的文献序号集合（用于压制"第 N 条文献没有被任何 \cite 引用"——
// Notebook 每格独立编译，声明格看不见其他格的引用，这条警告在宿主层是噪音）
export function collectCitedNums(source) {
  const nums = new Set()
  for (const m of String(source).matchAll(/\\cite\s*\{([^}]*)\}/g)) {
    for (const p of m[1].split(/[,，\s]+/)) {
      if (/^\d+$/.test(p)) nums.add(Number(p))
    }
  }
  return nums
}

const REF_SECTION_RE = /<section class="content-sources">[\s\S]*?<\/section>/g

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ---------- 代码格：首行声明 → 两条渲染路线 ----------
//   [cpp] / [python] / [js] …  普通代码块预览（Prism 上色 + 语言徽标）
//   [input] / [output]         输入 / 输出对照卡；相邻的 input+output 并成一张
//
// 声明行**原样留在格源码里**（作者要看得见自己在写什么），只在渲染产物里被剥掉；
// 剥的动作交给 highlightLaupCode —— 阅读页走的就是同一段实现，两边不会漂。

const SAMPLE_FENCE = 'sample'

/**
 * 围栏语言名是否应该被当成「代码格」而不是 laup 格的正文。
 *   ```code    代码格的**落库形态**：正文原样（含首行 `[lang]` 声明），语言不写在围栏上
 *   ```cpp …   语言写在围栏上的形态：旧版导出物、手写 .laup 都长这样 —— 继续认（向后兼容）
 *   ```sample  输入 / 输出对照卡
 */
export function isCodeFenceLang(name) {
  const lang = String(name || '').toLowerCase()
  return lang === CODE_FENCE_LANG || lang === SAMPLE_FENCE || isDeclarable(lang)
}

/** 对照卡一个栏位的源码（带它自己的语言声明行 —— 阅读页靠那行上色）。 */
function paneSource(decl) {
  const body = String(decl.body ?? '').replace(/\s+$/, '')
  return decl.raw ? `[${decl.raw}]\n${body}` : body
}

/**
 * 把对照卡某一栏的文本还原成一个代码格；空栏返回 null（空栏不生成格，
 * 否则重载一次就多出一格，往返不收敛）。
 * 栏内首行的语言声明保留在栏内（v2 起不再折回 `[input:cpp]`，
 * 而是原样写成两行：`[input]` 换行 `[cpp]`）。
 */
function paneCell(kind, text) {
  const body = String(text ?? '')
  if (!body.trim()) return null
  return { type: 'code', source: `[${kind}]\n${body}\n` }
}

function paneHtml(kind, index, text) {
  const isInput = kind === PANE_INPUT
  // 独占一行的 `---` / `===` 是服务端切分输入/输出的分隔符；栏内出现它就会切错位置。
  // 约束是 sample 格式固有的（老版同款），但栏位现在是手写的，所以必须看得见。
  const risky = /^[ \t]*(?:-{3,}|={3,})[ \t]*$/m.test(text)
  const warn = risky
    ? '<div class="code-pane-warn">栏内有独占一行的 --- / === —— 服务端会把它当输入/输出的分隔符，请改写或用多个样本格</div>'
    : ''
  return [
    `<div class="life-code-sample-pane ${isInput ? 'is-input' : 'is-output'}">`,
    warn,
    `<div class="life-code-sample-pane-head">`,
    `<span class="life-code-sample-label">${isInput ? '输入' : '输出'}<em>#${index}</em></span>`,
    `<span class="life-code-sample-sub">${isInput ? 'Input' : 'Output'}</span>`,
    `</div>`,
    `<pre class="life-code-sample-body"><code>${esc(text || '（空）')}</code></pre>`,
    `</div>`,
  ].join('')
}

/** 对照卡。class 与阅读页 life 扩展的 sampleHtml 逐字同款，样式天然一致。 */
export function codeSampleCardHtml(inputDecl, outputDecl, index = 0) {
  const input = inputDecl ? paneSource(inputDecl) : ''
  const output = outputDecl ? paneSource(outputDecl) : ''
  const panes = []
  if (input || !output) panes.push(paneHtml(PANE_INPUT, index, input))
  if (output) panes.push(paneHtml(PANE_OUTPUT, index, output))
  return [
    `<div class="life-code-sample">`,
    `<div class="life-code-sample-head">`,
    `<span class="life-code-sample-bar"></span>`,
    `<span class="life-code-sample-title">样例</span>`,
    `<span class="life-code-sample-title-sub">Sample</span>`,
    `</div>`,
    `<div class="life-code-sample-grid${panes.length < 2 ? ' is-single' : ''}">`,
    panes.join(''),
    `</div>`,
    `</div>`,
  ].join('')
}

/** 还没写声明时的提示：把可用类型摆出来（补全之外的第二处提示）。 */
export function codeDeclHintHtml() {
  const names = languageOptions().map((o) => `[${o.name}]`)
  names.push(`[${PANE_INPUT}]`, `[${PANE_OUTPUT}]`)
  return `<div class="code-decl-hint">首行写类型声明：<code>${esc(names.join(' '))}</code></div>`
}

/** 语言格（含还没写声明的）：一份与阅读页逐字同源的代码块预览。 */
export function codePreviewHtml(decl) {
  const body = String(decl.body ?? '').replace(/\s+$/, '')
  const hint = decl.kind === 'none' ? codeDeclHintHtml() : ''
  if (!body && !hint) return ''
  // 声明行放回首行交给 highlightLaupCode 剥 + 上色 —— 与阅读页同一条分支
  const src = decl.declText ? `${decl.declText}\n${body}` : body
  const attr = decl.lang ? ` class="language-${esc(decl.lang)}"` : ''
  return highlightLaupCode(`<pre><code${attr}>${esc(src)}</code></pre>`) + hint
}

/**
 * 规划所有「输入 / 输出」格的渲染分工。**按格下标做键**（不按 id）——
 * parseLaupDoc 产出的格还没有 id（id 由 store 的 emptyCell 发），
 * 按 id 做键会在那条路径上整片对不上。
 * 首行声明是 Laup 标记语言，落在哪种编辑格里都一样认（v1 存量文档的
 * `[input]` 格读进来就是 Laup 格，配对关系不能因此断掉）。
 * 返回 Map<格下标, plan>：
 *   { role: 'card', input, output, index }  这一格画一张对照卡
 *   { role: 'merged' }                      已被并进上一格的卡，本身不再渲染
 * 不在 Map 里的格 = 普通格。
 */
/**
 * 一格里同时写了 `[input]` 和 `[output]`（老文档常见写法）→ 拆成两栏。
 * 正常写法是两格相邻各写一栏，但单格里两段不能被塞进同一栏当正文，
 * 否则读者会看到输入栏里又冒出一段 "输出" 文本。
 */
function splitPaneBody(decl) {
  const body = String(decl.body ?? '')
  const marker = /^[ \t]*\[(input|output)\](?::[A-Za-z0-9_+#-]{1,16})?[ \t]*\r?$/im
  const m = marker.exec(body)
  if (!m) return null
  const otherKind = m[1].toLowerCase()
  if (otherKind === decl.kind) return null
  const first = { ...decl, body: body.slice(0, m.index).replace(/\s+$/, '') }
  const second = parseCodeDecl(`${m[0].trim()}\n${body.slice(m.index + m[0].length)}`)
  if (second.kind !== PANE_INPUT && second.kind !== PANE_OUTPUT) return null
  return decl.kind === PANE_INPUT
    ? { input: first, output: second }
    : { input: second, output: first }
}

export function planCodePanes(cells) {
  const plan = new Map()
  const list = Array.isArray(cells) ? cells : []
  let cardIndex = 0
  for (let i = 0; i < list.length; i++) {
    const c = list[i]
    if (!c || c.type === 'var') continue
    const decl = parseCodeDecl(c.source)
    if (decl.kind !== PANE_INPUT && decl.kind !== PANE_OUTPUT) continue
    // 单格里自带两栏：自己就够成一张对照卡，不再和下一格配对
    const intertwined = splitPaneBody(decl)
    if (intertwined) {
      plan.set(i, { role: 'card', input: intertwined.input, output: intertwined.output, index: cardIndex })
      cardIndex += 1
      continue
    }
    const next = list[i + 1]
    const nextDecl = next && next.type !== 'var' ? parseCodeDecl(next.source) : null
    if (decl.kind === PANE_INPUT && nextDecl?.kind === PANE_OUTPUT) {
      plan.set(i, { role: 'card', input: decl, output: nextDecl, index: cardIndex })
      plan.set(i + 1, { role: 'merged' })
      i += 1 // 已并入，不再单独成卡
    } else {
      plan.set(i, {
        role: 'card',
        input: decl.kind === PANE_INPUT ? decl : null,
        output: decl.kind === PANE_OUTPUT ? decl : null,
        index: cardIndex,
      })
    }
    cardIndex += 1
  }
  return plan
}

// ---------- lifetree 格：[lifetree] 声明 → 分类树预览 ----------
// 解析用 Laup 扩展（src/laup/extensions/lifetree.js），渲染用 /life-tree 页面同一个
// 布局函数（utils/lifeTreeLayout.js）—— 编辑器预览与站点生命树同一套矩形分支 DOM。
// 编辑器写源码时的浅色分叉线由 lifetreeDecor.js 画（按实际缩进）；
// 这里的树枝是布局输出的真实 DOM 矩形。只认 code 格首行 [lifetree]（落库成 ```lifetree 围栏）。
const LIFETREE_DECL_RE = /^\[lifetree\][ \t]*(?:\r?\n|$)/

/** 解析树 → 布局输入（{ data:{ uid, text, age }, children }） */
function toLayoutTree(n) {
  const data = { uid: `lt-${n.line}` }
  if (n.kind === 'diverge') {
    // 匿名分化点：图上只画分叉，不显示名字；带时间参数就标在旁边
    data.text = ''
    data.age = n.attrs?.时间 != null ? `${n.attrs.时间} Ma` : ''
  } else {
    const zh = n.zh ? `${n.extinct ? '†' : ''}${n.zh}` : ''
    data.text = [zh, n.latin].filter(Boolean).join(' ')
    const age = []
    if (n.attrs?.时间 != null) age.push(`${n.attrs.时间} Ma`)
    if (n.author && n.year != null) age.push(`${n.author}, ${n.year}`)
    else if (n.year != null) age.push(String(n.year))
    else if (n.author) age.push(n.author)
    data.age = age.join(' · ')
  }
  return { data, children: (n.children || []).map(toLayoutTree) }
}

function renderLayoutDom(root) {
  const layout = computeLifeTreeLayout(root)
  const branches = layout.branches.map((b) => {
    const style = b.dir === 'h'
      ? `left:${b.x}px;top:${b.y - 0.75}px;width:${b.length}px;height:1.5px`
      : `left:${b.x - 0.75}px;top:${b.y}px;width:1.5px;height:${b.length}px`
    return `<div class="tree-branch ${b.dir === 'h' ? 'is-horizontal' : 'is-vertical'}" style="${style}" aria-hidden="true"></div>`
  })
  const labels = layout.nodes.map((node) => {
    const parts = node.segments.map(
      (seg) => `<span class="${seg.latin ? 'latin' : 'chinese'}">${esc(seg.text)}</span>`,
    )
    if (node.age) parts.push(`<small class="age">${esc(node.age)}</small>`)
    if (!parts.length) return ''
    return `<span class="tree-label${node.isRoot ? ' is-root' : ''}" data-node-id="${esc(node.id)}" style="left:${node.labelLeft}px;top:${node.labelTop}px">${parts.join('')}</span>`
  })
  return `<div class="life-tree-dom"><div class="life-tree-canvas" style="width:${layout.width}px;height:${layout.height}px">`
    + branches.join('') + labels.join('')
    + '</div></div>'
}

export function lifetreePreviewHtml(body) {
  try {
    const parsed = parseLifetree(body)
    const warns = parsed.diags
      .map((d) => `<div class="laup-warn">⚠ ${esc(d.message)}</div>`).join('')
    if (!parsed.tree) {
      return warns || '<div class="code-decl-hint">在下面写树：每行一个节点，每级缩进两个空格，`/` 是匿名分化点</div>'
    }
    return renderLayoutDom(toLayoutTree(parsed.tree)) + warns
  } catch (e) {
    return `<pre class="error-out">${esc(e?.message || String(e))}</pre>`
  }
}

// ---------- 运行一个格 ----------
// refPool：全局文献数组（条目文本数组，store 用 buildRefPool 汇总传入）
// citedSet：全文被引序号（压制"未被引用"噪音警告）
// isRefDisplay：本格是否为全局文献列表的展示格（第一个声明格）
// pane：代码格的对照卡规划（planCodePanes 的产物），其他格型传 null 即可
export function runCellSource(cell, scope, refPool = [], citedSet = null, isRefDisplay = false, pane = null) {
  if (cell.type === 'var') {
    const pairs = collectVars(cell.source)
    for (const [k, v] of pairs) scope[k] = v
    const chips = pairs.map(([k, v]) => {
      const shown = esc(typeof v === 'string' ? v : JSON.stringify(v))
      // 多行值在芯片里压成一行（⏎ 表示换行），完整值放 title 悬浮查看
      const flat = shown.replace(/\n/g, '⏎')
      return `<span class="var-chip" title="${flat}">${esc(k)} = ${flat.length > 48 ? flat.slice(0, 48) + '…' : flat}</span>`
    })
    // 纯文献声明格（\reference + name[N]="…"）没有普通变量，输出留空即可
    if (!pairs.length && cellDeclaresRefs(cell)) return { outputHtml: '' }
    return { outputHtml: chips.join('') || '<span class="var-chip">（未定义变量）</span>' }
  }
  if (cell.type === 'code') {
    // 对照卡：卡画在「输入」格上，配对的「输出」格只留一句去向说明
    if (pane?.role === 'merged') {
      return { outputHtml: '<div class="code-pane-merged">↳ 已并入上一格的样例卡</div>' }
    }
    if (pane?.role === 'card') {
      return { outputHtml: codeSampleCardHtml(pane.input, pane.output, pane.index) }
    }
    const decl = parseCodeDecl(cell.source)
    // [lifetree]：分类树格，走自己的渲染路线（Laup Lifeseqence 扩展）
    if (decl.kind === 'lang' && decl.raw === LIFETREE_LANG) {
      return { outputHtml: lifetreePreviewHtml(decl.body) }
    }
    // 语言格（或还没写声明）：普通代码块预览，首行声明的语言决定上什么色
    return { outputHtml: codePreviewHtml(decl) }
  }
  // laup 格：预处理后交给 Laup 核心渲染，消毒 → 后处理恢复附件 data URL
  const { src, atts } = preprocess(cell.source, cell, scope)
  try {
    // 全局文献数组：本格的 \references 块先剥掉（条目已上交池），
    // 再把合并后的全局块注入 —— 任何格的 \cite{N} 都按全局编号解析
    const stripped = stripRefBlocks(src)
    const hasCite = /\\cite\s*\{/.test(stripped)
    const poolText = mergeRefBlocks(refPool)
    const inject = !!poolText && (hasCite || isRefDisplay)
    const full = inject ? stripped.replace(/\s*$/, '') + '\n\n' + poolText + '\n' : stripped
    const r = render(full, 'html', { mode: 'edit' })
    let out = restoreAttachments(r.output, atts)
    // 代码上色（宿主层）：语言围栏 + sample 卡输入栏首行 [lang] 声明
    out = highlightLaupCode(out)
    // 非展示格：剥掉渲染出的文献节，只留 \cite 上标（列表只在展示格出现一次）
    if (inject && !isRefDisplay) out = out.replace(REF_SECTION_RE, '')
    const warns = (r.warnings || [])
      .filter((w) => {
        const m = /第 (\d+) 条文献没有被任何/.exec(w.message || '')
        return !(m && citedSet?.has(Number(m[1])))
      })
      .map((w) => `<div class="laup-warn">⚠ ${esc(w.message)}</div>`).join('')
    return { outputHtml: sanitizeHtml(out) + warns }
  } catch (e) {
    return { outputHtml: `<pre class="error-out">渲染失败：${esc(e.message)}</pre>` }
  }
}

// ---------- 阅读面：整篇 .laup 按 Notebook 同一条管线渲染 ----------
// WikiPostDetail 的「Notebook 视图」用：拿 contentSource 在客户端按编辑器同一条
// 管线渲染（变量顺序求值、全局文献池、\cite 全局编号、代码格对照卡规划），
// 编辑器里长什么样阅读页就是什么样 —— 不经过服务端重渲，也不新增接口。
// 与 runAll 的差别（阅读面不要编辑器专有的东西）：
//   var 格零输出（芯片是给作者看的）、对照卡的"已并入"说明不出现、
//   ⚠ 警告条 / 类型声明提示条不外显（读者不该看到编辑辅助）。
// 返回拼接好的一段 HTML；空文档返回 ''（调用方回退到服务端入库 HTML）。
const EDITOR_ONLY_RE = /<div class="(?:laup-warn|code-decl-hint|code-pane-warn|code-pane-merged)">[\s\S]*?<\/div>/g

export function renderNotebookDoc(source, options = {}) {
  // 内核优先用文章落库的 content_kernel；存量文章没有该字段时才按内容判定。
  // 两套内核独立，互不翻译 —— v2 文档里的 v1 写法会以自己的诊断形式暴露出来。
  const text = String(source ?? '')
  const kernel = options.kernel === 'v1' || options.kernel === 'v2'
    ? options.kernel
    : detectLaupKernel(text)
  if (kernel === 'v2') {
    const raw = text.replace(/^[ \t]*import(?:\s+["'][^"']+["']|\s+[A-Za-z][\w-]*)[ \t]*$/gm, '')
    return raw.trim() ? typesetCells(raw).html : ''
  }

  const cells = parseLaupDoc(text)
  if (!cells.length) return ''
  const scope = {}
  const pool = buildRefPool(cells)
  const cited = new Set()
  for (const c of cells) {
    if (c.type !== 'laup') continue
    for (const n of collectCitedNums(c.source)) cited.add(n)
  }
  // 文献列表的展示格：与 store.refDisplayIdx 同口径 —— 第一个自带 \references 块的
  // laup 格；没有则退化为第一个 \cite 的 laup 格
  const dispIdx = cells.findIndex((c) => c.type === 'laup' && collectRefBlocks(c.source).length > 0)
  const refIdx = dispIdx >= 0 ? dispIdx : cells.findIndex((c) => c.type === 'laup' && /\\cite\s*\{/.test(c.source))
  const panes = planCodePanes(cells)
  const parts = []
  cells.forEach((c, i) => {
    // var 格只喂作用域（阅读面不显示芯片）
    if (c.type === 'var') {
      for (const [k, v] of collectVars(c.source)) scope[k] = v
      return
    }
    // 已并进上一张对照卡的输出格：阅读面直接跳过
    if (c.type === 'code' && panes.get(i)?.role === 'merged') return
    // 空格子不外显：没写任何东西的代码格会产出一个空 <pre>，
    // 两栏全空的对照卡会渲染一张"（空）"卡 —— 都是编辑器的占位形态，读者不该看到
    if (c.type === 'code') {
      const pane = panes.get(i)
      if (pane?.role === 'card' && !pane.input?.body?.trim() && !pane.output?.body?.trim()) return
      if (!pane && !String(c.source).trim()) return
    }
    try {
      const { outputHtml } = runCellSource(c, scope, pool, cited, i === refIdx, panes.get(i) || null)
      const clean = String(outputHtml || '').replace(EDITOR_ONLY_RE, '').trim()
      if (clean) parts.push(clean)
    } catch (e) {
      parts.push(`<pre class="error-out">渲染失败：${esc(e?.message || e)}</pre>`)
    }
  })
  return parts.join('\n')
}

// ---------- 解析 .laup 文档 → 格数组（载入示例 / 导入用） ----------
// 规则（宿主层约定）：
//   `import "laup"` 行剥掉
//   ```lang 围栏（独占一格）→ code 格，围栏语言还原成首行声明 `[lang]`
//   ```sample 围栏 → 按分隔行拆成 [input] / [output] 两个 code 格
//   \varcell=[ … ] 块（自带导出产物）→ 一个 var 格，内容逐行还原
//   顶层连续 var 行 → 一个 var 格（更旧的文档，没有 \varcell 块）
//   其余内容按空行切成 laup 格
export function parseLaupDoc(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  // 文档里只要出现 \cellbreak 标记，它就是唯一的格边界 —— 空行只是格内段落分隔。
  // 没有标记的旧文档（手写 .laup）维持原启发式：空行切格。
  const hasMarkers = /^[ \t]*\\cellbreak[ \t]*=[ \t]*\[/m.test(text)
  const cells = []
  let buf = []
  const flush = () => {
    const s = buf.join('\n').trim()
    if (s) cells.push({ type: 'laup', source: s + '\n' })
    buf = []
  }
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^[ \t]*import(?:\s+["'][^"']+["']|\s+[A-Za-z][\w-]*)[ \t]*$/.test(line)) { i++; continue }
    // Notebook 导出的格边界标记（life 扩展零输出块）：到这里就是一格的结束。
    // 两行形式：\cellbreak=[ 换行 ]
    if (/^[ \t]*\\cellbreak[ \t]*=[ \t]*\[[ \t]*$/.test(line)) {
      flush()
      i++
      if (i < lines.length && /^[ \t]*\][ \t]*$/.test(lines[i])) i++
      continue
    }
    // 变量格（life 扩展的零输出块 \varcell=[ … ]）：一行一个字符串元素，拼回格源码。
    // 刻意**不看 hasMarkers** —— 手写 .laup 里出现它同样该还原成 var 格。
    const varBlock = readVarBlock(lines, i)
    if (varBlock) {
      flush()
      cells.push({ type: 'var', source: varBlock.source })
      i = varBlock.next
      continue
    }
    if (!line.trim()) {
      if (hasMarkers) { buf.push(line); i++; continue }
      flush(); i++; continue
    }
    const fence = /^```[ \t]*([A-Za-z0-9_+#-]*)[ \t]*$/.exec(line)
    const fenceLang = (fence?.[1] || '').toLowerCase()
    const isFenceCell = isCodeFenceLang(fenceLang) || fenceLang === LIFETREE_LANG
    if (fence && isFenceCell) {
      // 标记模式下，围栏只有独占一格（前面没有同格正文）时才是代码格；
      // laup 格中间出现的围栏是格内容的一部分，原样保留不切。
      if (hasMarkers && buf.some((l) => l.trim())) { buf.push(line); i++; continue }
      flush()
      if (hasMarkers) buf = [] // 围栏前的空白行只是排版，不留给下一格
      i++
      const body = []
      while (i < lines.length && !/^```[ \t]*$/.test(lines[i])) { body.push(lines[i]); i++ }
      i++ // 跳过闭合围栏
      const lang = fence[1].toLowerCase()
      const text = body.join('\n').replace(/^\n+/, '').replace(/\s+$/, '')
      if (lang === LIFETREE_LANG) {
        // 分类树围栏：还原成 [lifetree] 代码格（声明行回到源码首行，作者可见）
        cells.push({ type: 'code', source: `[${LIFETREE_LANG}]\n${text}\n` })
      } else if (lang === SAMPLE_FENCE) {
        // 输入 / 输出对照：还原成 [input] + [output] 两格（与手写形态一一对应）
        const { input, output } = parseCodeSampleText(text)
        const inputCell = paneCell(PANE_INPUT, input)
        const outputCell = paneCell(PANE_OUTPUT, output)
        if (inputCell) cells.push(inputCell)
        if (outputCell) cells.push(outputCell)
        // 两侧都空（只敲了围栏与分隔符）：保留一个空的输入格，别把这一格整没了
        if (!inputCell && !outputCell) cells.push({ type: 'code', source: `[${PANE_INPUT}]\n\n` })
      } else if (lang === CODE_FENCE_LANG) {
        // 代码格的落库形态：围栏正文**就是**格源码（含首行 `[cpp]` 声明），原样收下。
        // 刻意不做「从围栏标签拼回声明」的还原 —— 那正是老写法丢格的那道缝。
        cells.push({ type: 'code', source: text ? `${text}\n` : '' })
      } else {
        // 老形态 / 手写形态：语言名即首行声明（`[lang]` 留在格源码里，作者改语言就在第一行改）
        cells.push({ type: 'code', source: `[${lang}]\n${text}\n` })
      }
      continue
    }
    // var 分支只服务**更旧**的文档（无标记、无 \varcell 块，靠裸 var 行 + 空行启发式）。
    // 标记模式下不能走这里 —— `var x = 1` + 空行 + 正文是同一格，提前收格会把格拆成两格。
    // 现在 Notebook 导出的变量格一律走上面的 \varcell 块，与格边界无关，不会再被这一条影响。
    if (!hasMarkers && /^[ \t]*var\s+[A-Za-z_]\w*\s*=/.test(line)) {
      flush()
      const body = []
      let j = i
      while (j < lines.length) {
        // 格边界标记：var 格到此为止（连续 var 语句归同一格的规则不能跨过它）
        if (/^[ \t]*\\cellbreak[ \t]*=[ \t]*\[[ \t]*$/.test(lines[j])) break
        const st = readVarStatement(lines, j)
        if (!st) break
        body.push(...lines.slice(j, st.end))
        j = st.end
      }
      i = j
      cells.push({ type: 'var', source: body.join('\n').trim() + '\n' })
      continue
    }
    buf.push(line); i++
  }
  flush()
  return cells
}
