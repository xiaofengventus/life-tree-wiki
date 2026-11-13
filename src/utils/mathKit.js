// laup-math → LaTeX 编译器 v1
// 语法规范见 docs/math-syntax.md：
//   修饰层：a(上标)(下标)[头部][尾部]，只写下标用逗号占位 a(,i)
//   函数层：frac(a,b) sqrt(x) root(3,x) sum(i=1,n,体) int(a,b,体) lim(x->0,体)
//           matrix(a,b;c,d) cases(p,q;r,s) paren abs norm floor ceil
//   符号/希腊字母拼英文名；"文字" → \text{}；\开头原样直通 LaTeX（逃生门）
// translate() 失败返回 null，由调用方回退原文，绝不抛出。

const GREEK = {
  alpha: '\\alpha', beta: '\\beta', gamma: '\\gamma', delta: '\\delta',
  epsilon: '\\epsilon', varepsilon: '\\varepsilon', zeta: '\\zeta', eta: '\\eta',
  theta: '\\theta', vartheta: '\\vartheta', iota: '\\iota', kappa: '\\kappa',
  lambda: '\\lambda', mu: '\\mu', nu: '\\nu', xi: '\\xi', omicron: 'o',
  pi: '\\pi', rho: '\\rho', sigma: '\\sigma', varsigma: '\\varsigma',
  tau: '\\tau', upsilon: '\\upsilon', phi: '\\phi', varphi: '\\varphi',
  chi: '\\chi', psi: '\\psi', omega: '\\omega',
  Gamma: '\\Gamma', Delta: '\\Delta', Theta: '\\Theta', Lambda: '\\Lambda',
  Xi: '\\Xi', Pi: '\\Pi', Sigma: '\\Sigma', Upsilon: '\\Upsilon',
  Phi: '\\Phi', Psi: '\\Psi', Omega: '\\Omega',
}

const SYMBOLS = {
  infty: '\\infty', partial: '\\partial', nabla: '\\nabla', hbar: '\\hbar',
  pm: '\\pm', mp: '\\mp', times: '\\times', cdot: '\\cdot', div: '\\div',
  oplus: '\\oplus', ominus: '\\ominus', odot: '\\odot', circ: '\\circ',
  le: '\\le', ge: '\\ge', ne: '\\ne', approx: '\\approx', sim: '\\sim',
  simeq: '\\simeq', propto: '\\propto', equiv: '\\equiv', cong: '\\cong',
  in: '\\in', notin: '\\notin', subset: '\\subset', supset: '\\supset',
  subseteq: '\\subseteq', supseteq: '\\supseteq', cup: '\\cup', cap: '\\cap',
  emptyset: '\\varnothing', forall: '\\forall', exists: '\\exists',
  neg: '\\neg', therefore: '\\therefore', because: '\\because',
  angle: '\\angle', perp: '\\perp', parallel: '\\parallel', mid: '\\mid',
  ldots: '\\ldots', cdots: '\\cdots', vdots: '\\vdots', ddots: '\\ddots',
  deg: '\\deg', star: '\\star', bullet: '\\bullet',
}

const ACCENTS = {
  vec: '\\vec', hat: '\\hat', bar: '\\bar', tilde: '\\tilde',
  dot: '\\dot', ddot: '\\ddot', overline: '\\overline', underline: '\\underline',
}

// 名单内函数：name(args) 按函数调用编译；名单外字母紧贴 ( 按上标修饰（见规范 §5.1）
const FUNCS = new Set([
  'frac', 'dfrac', 'tfrac', 'sqrt', 'root', 'paren', 'abs', 'norm', 'floor', 'ceil',
  'matrix', 'cases', 'sum', 'prod', 'int', 'iint', 'oint', 'lim',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh',
  'arcsin', 'arccos', 'arctan', 'ln', 'log', 'lg', 'exp', 'max', 'min', 'det', 'dim', 'Pr',
])

const SIMPLE_FUNCS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh',
  'arcsin', 'arccos', 'arctan', 'ln', 'log', 'lg', 'exp', 'max', 'min', 'det', 'dim', 'Pr',
])

const OPS3 = { '<->': '\\leftrightarrow ', '<=>': '\\rightleftharpoons ' }
const OPS2 = {
  '->': '\\to ', '=>': '\\Rightarrow ', '<=': '\\le ', '>=': '\\ge ',
  '!=': '\\ne ', '<-': '\\leftarrow ', '...': '\\ldots ',
}

function escText(t) {
  return t.replace(/[\\{}%&#$~^_]/g, (c) => '\\' + c)
}

function compile(src) {
  const s = String(src)
  let i = 0
  const n = s.length

  const peek = (k = 0) => s[i + k]
  const isLetter = (c) => /[a-zA-Z]/.test(c)
  const isDigit = (c) => /[0-9]/.test(c)

  // 读配对括号内容，i 推进到闭括号之后；不配对抛错
  function readBalanced(open, close) {
    if (peek() !== open) throw new Error('expected ' + open)
    let depth = 0
    const start = ++i
    while (i < n) {
      const c = s[i]
      if (c === '\\') { i += 2; continue }
      if (c === '"') { const j = s.indexOf('"', i + 1); if (j < 0) throw new Error('unclosed quote'); i = j + 1; continue }
      if (c === open) depth++
      else if (c === close) {
        if (depth === 0) return s.slice(start, i++)
        depth--
      }
      i++
    }
    throw new Error('unclosed ' + open)
  }

  // 顶层按 sep 切分（跳过嵌套括号与引号）
  function splitTop(inner, sep) {
    const parts = []
    let depth = 0, start = 0, inQuote = false
    for (let k = 0; k < inner.length; k++) {
      const c = inner[k]
      if (c === '\\') { k++; continue }
      if (c === '"') inQuote = !inQuote
      if (inQuote) continue
      if ('([{'.includes(c)) depth++
      else if (')]}'.includes(c)) depth--
      else if (c === sep && depth === 0) { parts.push(inner.slice(start, k)); start = k + 1 }
    }
    parts.push(inner.slice(start))
    return parts
  }

  const T = (frag) => {
    const r = compile(frag)
    if (r === null) throw new Error('bad fragment: ' + frag)
    return r
  }

  // 读 (..) 槽位：第1个 ( 为上标槽、第2个为下标槽；槽内顶层逗号 → sup,sub
  function parseParens() {
    const sups = [], subs = []
    while (peek() === '(') {
      const inner = readBalanced('(', ')')
      const parts = splitTop(inner, ',')
      if (parts.length === 1) {
        (sups.length <= subs.length ? sups : subs).push(T(parts[0]))
      } else if (parts.length === 2) {
        sups.push(T(parts[0])); subs.push(T(parts[1]))
      } else throw new Error('too many commas in ()')
    }
    return { sup: sups.join(''), sub: subs.join('') }
  }

  // 读 [..] 装饰：第1个=头部（叠在基础符号上）、第2个=尾部（\underset）、之后继续叠头部
  function parseBrackets(base) {
    let idx = 0
    while (peek() === '[') {
      const inner = readBalanced('[', ']')
      idx++
      if (idx === 2) base = '\\underset{' + T(inner) + '}{' + base + '}'
      else if (ACCENTS[inner]) base = ACCENTS[inner] + '{' + base + '}'
      else base = '\\overset{' + T(inner) + '}{' + base + '}'
    }
    return base
  }

  function parseMods(base) {
    const { sup, sub } = parseParens()
    base = parseBrackets(base)
    if (sup) base += '^{' + sup + '}'
    if (sub) base += '_{' + sub + '}'
    return base
  }

  function funcLatex(name, inner) {
    const args = splitTop(inner, ',').map((a) => a.trim())
    switch (name) {
      case 'frac': case 'dfrac': case 'tfrac': {
        if (args.length !== 2) throw new Error(name + ' 需要 2 个参数')
        return '\\' + name + '{' + T(args[0]) + '}{' + T(args[1]) + '}'
      }
      case 'sqrt': {
        if (args.length !== 1) throw new Error('sqrt 需要 1 个参数')
        return '\\sqrt{' + T(args[0]) + '}'
      }
      case 'root': {
        if (args.length !== 2) throw new Error('root(n,x) 需要 2 个参数')
        return '\\sqrt[' + T(args[0]) + ']{' + T(args[1]) + '}'
      }
      case 'paren': return '\\left(' + T(args.join(',')) + '\\right)'
      case 'abs': return '\\left|' + T(args.join(',')) + '\\right|'
      case 'norm': return '\\left\\|' + T(args.join(',')) + '\\right\\|'
      case 'floor': return '\\left\\lfloor ' + T(args.join(',')) + ' \\right\\rfloor'
      case 'ceil': return '\\left\\lceil ' + T(args.join(',')) + ' \\right\\rceil'
      case 'matrix': {
        const rows = splitTop(inner, ';').map((r) => splitTop(r, ',').map(T).join(' & '))
        return '\\begin{pmatrix} ' + rows.join(' \\\\ ') + ' \\end{pmatrix}'
      }
      case 'cases': {
        const rows = splitTop(inner, ';').map((r) => splitTop(r, ',').map(T).join(' & '))
        return '\\begin{cases} ' + rows.join(' \\\\ ') + ' \\end{cases}'
      }
      case 'sum': case 'prod': {
        if (args.length !== 3) throw new Error(name + '(初值,上限,体) 需要 3 个参数')
        return '\\' + name + '_{' + T(args[0]) + '}^{' + T(args[1]) + '} ' + T(args[2])
      }
      case 'int': case 'iint': case 'oint': {
        const sym = '\\' + name
        if (args.length === 3) return sym + '_{' + T(args[0]) + '}^{' + T(args[1]) + '} ' + T(args[2])
        if (args.length === 1) return sym + ' ' + T(args[0])
        throw new Error(name + ' 需要 1 或 3 个参数')
      }
      case 'lim': {
        if (args.length !== 2) throw new Error('lim(条件,体) 需要 2 个参数')
        return '\\lim_{' + T(args[0]) + '} ' + T(args[1])
      }
      default:
        if (SIMPLE_FUNCS.has(name)) return '\\' + name + '\\left(' + T(args.join(',')) + '\\right)'
        throw new Error('unknown func ' + name)
    }
  }

  const out = []
  while (i < n) {
    const c = s[i]
    if (c === '\\') { // LaTeX 逃生门：\命令或\符号原样直通
      let j = i + 1
      if (j < n && isLetter(s[j])) { while (j < n && isLetter(s[j])) j++ }
      else if (j < n) j++
      out.push(s.slice(i, j)); i = j; continue
    }
    if (c === '"') {
      const j = s.indexOf('"', i + 1)
      if (j < 0) throw new Error('unclosed quote')
      out.push('\\text{' + escText(s.slice(i + 1, j)) + '}'); i = j + 1; continue
    }
    if (c === '{') { out.push('{' + T(readBalanced('{', '}')) + '}'); continue }
    if (isLetter(c)) {
      let j = i; while (j < n && isLetter(s[j])) j++
      const run = s.slice(i, j)
      if (FUNCS.has(run) && s[j] === '(') {
        i = j
        const inner = readBalanced('(', ')')
        out.push(parseMods(funcLatex(run, inner)))
        continue
      }
      if (GREEK[run]) { i = j; out.push(parseMods(GREEK[run])); continue }
      if (SYMBOLS[run]) { i = j; out.push(parseMods(SYMBOLS[run])); continue }
      while (i < j) { const ch = s[i++]; out.push(parseMods(ch)) } // 逐字母：mv(2) → m v²，dx 不变
      continue
    }
    if (isDigit(c) || (c === '.' && isDigit(peek(1)))) {
      let j = i; while (j < n && /[0-9]/.test(s[j])) j++
      if (s[j] === '.' && /[0-9]/.test(s[j + 1] || '')) { j++; while (j < n && /[0-9]/.test(s[j])) j++ }
      const num = s.slice(i, j); i = j
      out.push(parseMods(num))
      continue
    }
    const three = s.slice(i, i + 3), two = s.slice(i, i + 2)
    if (OPS3[three]) { out.push(OPS3[three]); i += 3; continue }
    if (OPS2[two]) { out.push(OPS2[two]); i += 2; continue }
    if (c === '*') { out.push('\\cdot '); i++; continue }
    out.push(c); i++
  }
  return out.join('')
}

// 对外入口：编译失败或无构造时返回 null（调用方用原文渲染），保证纯 LaTeX 输入零损耗
export function translate(src) {
  if (src == null || src === '') return null
  try {
    const r = compile(src)
    return typeof r === 'string' && r.trim() !== '' ? r : null
  } catch {
    return null
  }
}

export default { translate }
