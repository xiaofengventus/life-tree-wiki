/**
 * 正文文本层的 LaTeX 识别。
 *
 * 为什么需要它：
 *   正文存储的是 HTML，公式只有两个来源会变成 `data-life-math` 节点 ——
 *   「插入公式对话框」和「Markdown 入口」（导入 / 预览面板 / MD 单元格）。
 *   作者在富文本编辑器里直接把 `$…$` 或裸 LaTeX 敲进段落时，编辑器
 *   **不做任何解析**，这些字符就永远停在文字层，读者页自然也永远渲染不出来。
 *
 * 本模块在**渲染时**补上这一步：扫描文本节点，把识别到的 LaTeX 包成
 * `<span data-life-math="inline" data-latex="…">`，之后由 formula.js 的
 * KaTeX 渲染接管。**不修改任何已存储的数据**，纯显示层行为。
 *
 * ⚠️ 本模块**刻意零依赖**（不 import katex / markdown / richHtml）：
 *   - formula.js 顶部有 katex 的 CSS，Node 原生 ESM 解析不了它；
 *     只要本模块够纯，就能被 Node 单测直接引用（见 tests/latexScan.test.mjs）。
 *   - markdown.js 也要用它做解析前置处理，反向依赖会造成循环。
 */

/** 单个公式的长度上限，与 utils/formula.js 的 MAX_FORMULA_LENGTH 保持一致 */
export const LATEX_MAX_LENGTH = 4_000;

/**
 * 这些标签内部的内容一律不动。
 * 代码块 / 行内代码里出现 `\frac` 是在讲 LaTeX 本身，不是公式；
 * 链接文字不动是为了避免把 URL 片段误伤。
 */
const SKIP_SELECTOR = "code,pre,a,script,style,textarea,kbd,samp,svg,[data-life-math],[data-life-stay]";

/**
 * 裸 LaTeX 的命令白名单。
 *
 * 只认这些命令 —— 这是防误判的第一道闸门。像 `\n`、`\t`、`\d`、
 * `\Users`（Windows 路径）这类普通反斜杠序列不在此列，天然被排除。
 */
const MATH_COMMANDS = new Set([
  // 结构 / 排版
  "frac", "dfrac", "tfrac", "cfrac", "binom", "sqrt", "overline", "underline",
  "widehat", "widetilde", "overrightarrow", "overleftarrow",
  "vec", "hat", "bar", "tilde", "dot", "ddot", "acute", "grave", "check", "breve", "mathring",
  "mathrm", "mathbf", "mathit", "mathsf", "mathtt", "mathcal", "mathbb", "mathfrak",
  "boldsymbol", "text", "textrm", "textit", "textbf", "texttt", "operatorname", "mbox",
  // 颜色 / 字体（KaTeX 原生支持，常用于正文里给关键词上色）
  "textcolor", "color", "colorbox", "fcolorbox", "textnormal", "textsf", "textup",
  "left", "right", "big", "Big", "bigg", "Bigg", "bigl", "bigr", "Bigl", "Bigr",
  "lvert", "rvert", "lVert", "rVert", "vert", "Vert", "langle", "rangle",
  "lceil", "rceil", "lfloor", "rfloor", "llbracket", "rrbracket",
  "quad", "qquad", "hspace", "vspace", "displaystyle", "textstyle",
  "limits", "nolimits", "overset", "underset", "stackrel", "substack",
  "phantom", "boxed", "underbrace", "overbrace", "begin", "end",
  "cases", "matrix", "pmatrix", "bmatrix", "vmatrix", "Vmatrix", "aligned", "array", "split",
  "scriptstyle", "scriptscriptstyle", "tiny", "small", "large",
  // 运算与关系
  "times", "cdot", "div", "pm", "mp", "ast", "star", "circ", "bullet",
  "oplus", "ominus", "otimes", "oslash", "odot", "dagger", "ddagger",
  "leq", "geq", "le", "ge", "ne", "neq", "approx", "equiv", "sim", "simeq", "cong", "propto",
  "ll", "gg", "prec", "succ", "subset", "supset", "subseteq", "supseteq",
  "in", "notin", "ni", "cup", "cap", "setminus", "emptyset", "varnothing",
  "forall", "exists", "nexists", "neg", "land", "lor", "implies", "iff",
  "therefore", "because", "dots", "ldots", "cdots", "vdots", "ddots",
  // 大型算子
  "sum", "prod", "coprod", "int", "iint", "iiint", "oint", "lim", "limsup", "liminf",
  "max", "min", "sup", "inf", "partial", "nabla", "infty",
  // 几何 / 箭头
  "angle", "perp", "parallel", "triangle", "square", "degree", "prime",
  "to", "rightarrow", "leftarrow", "leftrightarrow", "Rightarrow", "Leftarrow",
  "Leftrightarrow", "mapsto", "uparrow", "downarrow", "longrightarrow",
  // 函数名
  "sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan",
  "sinh", "cosh", "tanh", "log", "ln", "lg", "exp", "det", "dim", "ker",
  "deg", "gcd", "bmod", "pmod", "mod",
  // 大写希腊
  "Delta", "Gamma", "Theta", "Lambda", "Xi", "Pi", "Sigma", "Upsilon",
  "Phi", "Psi", "Omega",
  // 小写希腊
  "alpha", "beta", "gamma", "delta", "epsilon", "varepsilon", "zeta", "eta",
  "theta", "vartheta", "iota", "kappa", "lambda", "mu", "nu", "xi", "pi",
  "varpi", "rho", "varrho", "sigma", "varsigma", "tau", "upsilon",
  "phi", "varphi", "chi", "psi", "omega",
  "ell", "hbar", "aleph", "Re", "Im", "wp", "imath", "jmath",
]);

/**
 * 裸 LaTeX 片段**在花括号外**允许出现的字符。
 *
 * 这是一份白名单：中文、中文标点、全角符号、中文弯引号都不在里面，
 * 所以片段碰到它们就自然截断 —— 这正是「公式夹在中文句子里」时
 * 能精确切出边界的原因。花括号**内部**不受此限制（见 expandRight）。
 */
const MATH_CHAR_RE = /[A-Za-z0-9\s\\{}_^=+\-*/()\[\].,<>|!'"\u00b7\u0370-\u03ff\u2200-\u22ff]/;

/** 中日韩统一表意文字：用于 `$…$` 的货币误判防护 */
const HAN_RE = /\p{Script=Han}/u;

/** 纯数字（可能带千分位 / 小数点）—— 更像价格而不是公式 */
const PURE_NUMBER_RE = /^[\d,.\s]+$/;

/**
 * 把块级公式按「顶层换行」切成多行。
 *
 * ⚠️ 这段是为一个**很容易踩的 LaTeX 语义坑**服务的：
 * 在 display 模式下，顶层的 `\\` / `\newline` 是**空操作**
 * （KaTeX 官方警告：`In LaTeX, \\ or \newline does nothing in display mode`），
 * 裸换行更是只当空格。所以作者在公式框里按回车、或写 `a=1 \\ b=2`，
 * 渲染出来都是挤在一行的 —— 这就是「写 LaTeX 换行不生效」的根因。
 * 要换行**必须放进环境**（aligned / cases / array / gathered …）。
 *
 * 这里把顶层换行切出来，交给 wrapTopLevelLineBreaks 包一层 `gathered`。
 *
 * 判定用的是**环境栈 + 花括号深度**：
 *   - 已经处在 `\begin{}…\end{}` 里的换行原样保留（那是环境自己的行分隔）；
 *   - 花括号（如 `\text{…}`）内部的换行不当行分隔；
 *   - 连续的裸换行折叠掉，`a \\` 后面跟的换行也不会被当成第二个断点。
 */
function splitTopLevelRows(source) {
  const rows = [];
  const envStack = [];
  let braceDepth = 0;
  let current = "";
  let i = 0;

  const readEnvName = (at) => {
    if (!source.startsWith("\\begin{", at) && !source.startsWith("\\end{", at)) return "";
    const close = source.indexOf("}", at + 7);
    return close < 0 ? "" : source.slice(at + 7, close);
  };

  while (i < source.length) {
    const envName = readEnvName(i);
    if (envName) {
      if (source.startsWith("\\end{", i)) envStack.pop();
      else envStack.push(envName);
      const token = (source.startsWith("\\end{", i) ? "\\end{" : "\\begin{") + envName + "}";
      current += token;
      i += token.length;
      continue;
    }

    const char = source[i];
    if (char === "\\") {
      const isDouble = source[i + 1] === "\\";
      const isNewline = source.startsWith("\\newline", i);
      const isCr = source.startsWith("\\cr", i);
      if (isDouble || isNewline || isCr) {
        if (!envStack.length) {
          rows.push(current.trim());
          current = "";
          i += isDouble ? 2 : isNewline ? 8 : 3;
          while (i < source.length && /\s/.test(source[i])) i += 1;
          continue;
        }
      }
      current += char + (source[i + 1] ?? "");
      i += 2;
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
      current += char;
      i += 1;
      continue;
    }
    if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      current += char;
      i += 1;
      continue;
    }
    if (char === "\n" && !envStack.length && braceDepth === 0) {
      if (current.trim()) {
        rows.push(current.trim());
        current = "";
      }
      i += 1;
      continue;
    }

    current += char;
    i += 1;
  }

  if (current.trim()) rows.push(current.trim());
  return rows;
}

/**
 * 块级公式的顶层换行归一：多行时自动包一层 `\begin{gathered}…\end{gathered}`。
 *
 * 只在真的切出 ≥2 行时才包装，单行公式原样返回 —— 不改变现有 90 个块级公式的表现。
 * 存进 `data-latex` 的仍然是**原始源码**，包装只作用于 KaTeX 立刻渲染的那一次，
 * 所以公式对话框里回显的还是作者写的样子。
 */
export function wrapTopLevelLineBreaks(source) {
  const text = String(source ?? "");
  if (!text.trim()) return text;
  const rows = splitTopLevelRows(text);
  if (rows.length < 2) return text;
  return "\\begin{gathered}" + rows.join(" \\\\ ") + "\\end{gathered}";
}

function isEscaped(text, index) {
  let count = 0;
  let cursor = index - 1;
  while (cursor >= 0 && text[cursor] === "\\") {
    count += 1;
    cursor -= 1;
  }
  return count % 2 === 1;
}

/** 找下一个没被反斜杠转义的 token */
function findUnescaped(text, token, from) {
  let cursor = from;
  while (cursor <= text.length - token.length) {
    const index = text.indexOf(token, cursor);
    if (index < 0) return -1;
    if (!isEscaped(text, index)) return index;
    cursor = index + 1;
  }
  return -1;
}

function hasBalancedBraces(source) {
  let depth = 0;
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === "\\") {
      i += 1;
      continue;
    }
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

/**
 * 向右扩张片段。
 *
 * 关键点：**花括号内部无条件吞**（第 3 个分支）—— 因为 `\text{合}`、
 * `\vec{F}_{\text{合}}` 这类写法里一定有中文，若按字符白名单处理会在
 * `合` 处截断，导致括号配平失败、整条公式被丢弃。
 */
function expandRight(text, start) {
  let pos = start;
  let depth = 0;
  while (pos < text.length) {
    const char = text[pos];
    if (char === "\\") {
      const command = /^\\[A-Za-z]+/.exec(text.slice(pos));
      pos += command ? command[0].length : 2;
      continue;
    }
    if (char === "{") {
      depth += 1;
      pos += 1;
      continue;
    }
    if (char === "}") {
      if (depth === 0) break;
      depth -= 1;
      pos += 1;
      continue;
    }
    if (depth > 0) {
      pos += 1;
      continue;
    }
    if (MATH_CHAR_RE.test(char)) {
      pos += 1;
      continue;
    }
    break;
  }
  return pos;
}

/**
 * 向左扩张片段，规则与 expandRight 对称 —— 但有一处刻意不同：
 *
 * 左向扫描遇到 `{` 时**不能停下**。因为扫描是从命令的反斜杠起步往左走，
 * 此时撞见的 `{` 往往是「这个命令所属的那一组」的**开括号**
 * （`I_{\text{encl}}` 里 `\text` 左边就是这种情况）。
 * 一旦在这里 break，片段就只剩 `\text{encl}`，把 `I_` 丢了。
 * 而真正该停的地方由字符白名单兜底（中文、中文标点都不在白名单里）。
 */
function expandLeft(text, start) {
  let pos = start;
  let depth = 0;
  while (pos > 0) {
    const char = text[pos - 1];
    if (char === "}") {
      depth += 1;
      pos -= 1;
      continue;
    }
    if (char === "{") {
      depth = Math.max(0, depth - 1);
      pos -= 1;
      continue;
    }
    if (depth > 0) {
      pos -= 1;
      continue;
    }
    if (MATH_CHAR_RE.test(char)) {
      pos -= 1;
      continue;
    }
    break;
  }
  return pos;
}

/**
 * 按括号配平把尾部缺失的 `}` 补回来。
 *
 * 为什么必需：左右两个方向的扩张是**各自独立**的。像 `x_{\text{a}}` 这种
 * 「开括号在外层」的结构，右向扩张在命令所属组的结尾就停了，
 * 外层那个 `}` 会被留下 —— 片段于是变成 `x_{\text{a}`，括号不配平，
 * 整条公式被丢弃（`I_{\text{encl}}` 就是这样漏掉的）。
 *
 * 这里只沿尾部**连续的** `}` 补齐，补够即止；补不齐就原样返回，
 * 交给 isMeaningfulLatex 的配平校验拒掉。
 */
function balanceTrailingBraces(text, start, end) {
  let depth = 0;
  for (let i = start; i < end; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") depth -= 1;
  }
  let cursor = end;
  while (depth > 0 && cursor < text.length && text[cursor] === "}") {
    depth -= 1;
    cursor += 1;
  }
  return depth === 0 ? cursor : end;
}

/**
 * 判断切出来的片段是否「足够像公式」。
 *
 * 两道硬校验：含白名单命令、括号配平。
 * 第三道是防散文的软校验，阈值是拿真实文章实测调出来的：
 *
 *   - 片段里若出现 `{` `^` `_` `=`，就已经是明确的数学结构，**不再做单词检查**。
 *     否则 `\sum m\vec v= const`、`F=BIL\sin\theta`、`\mathcal{E}=BLv`、
 *     `E_p=-\dfrac{GMm}{r}` 这类混着物理符号的公式会被误杀。
 *   - 没有数学结构时，才要求不出现 **4 个以上连续字母**。
 *     阈值取 4 而不是 3：`mol` / `rms` / `kT` / `encl` / `BIL` 都是合法物理
 *     记号，而 `value` / `test` 这类散文词多半更长。
 *     这样既放行 `\nu mol`、`\tfrac12 kT`，又挡住了 `\alpha value`。
 */
function isMeaningfulLatex(fragment) {
  if (!fragment || fragment.length > LATEX_MAX_LENGTH) return false;
  if (!/\\[A-Za-z]+/.test(fragment)) return false;
  if (!hasBalancedBraces(fragment)) return false;
  if (!/[{}^_=]/.test(fragment)) {
    const withoutCommands = fragment.replace(/\\[A-Za-z]+/g, "");
    if (/[A-Za-z]{4,}/.test(withoutCommands)) return false;
  }
  return true;
}

/**
 * `$…$` 的收尾查找。
 *
 * 这里有一组「像钱不像公式」的排除规则，都是实测踩出来的：
 * 反斜杠转义（`\$5`）、内容带换行、内容两端有空白、
 * 纯数字（`$5,000$` 更像价格）、含中文却没有命令（`$总共5$`）。
 */
function findDollarClose(text, from, token, openIndex) {
  let cursor = from;
  while (cursor <= text.length - token.length) {
    const index = text.indexOf(token, cursor);
    if (index < 0) return null;
    if (isEscaped(text, index)) {
      cursor = index + token.length;
      continue;
    }
    const content = text.slice(from, index);
    if (!content) {
      cursor = index + token.length;
      continue;
    }
    if (token === "$") {
      if (content.includes("\n")) return null;
      if (/^\s/.test(content) || /\s$/.test(content)) {
        cursor = index + 1;
        continue;
      }
      if (PURE_NUMBER_RE.test(content)) {
        cursor = index + 1;
        continue;
      }
      if (HAN_RE.test(content) && !content.includes("\\")) {
        cursor = index + 1;
        continue;
      }
      if (/\d/.test(text[openIndex - 1] || "")) return null;
    } else if (!content.trim()) {
      cursor = index + token.length;
      continue;
    }
    if (content.length > LATEX_MAX_LENGTH) return null;
    return { content: token === "$$" ? content.trim() : content, end: index };
  }
  return null;
}

/** 第一遍：按定界符切分（`$…$` / `$$…$$` / `\(…\)` / `\[…\]` / `\begin{}…\end{}`） */
function splitByDelimiters(text) {
  const out = [];
  let buffer = "";
  let i = 0;
  const flush = () => {
    if (buffer) out.push({ type: "text", value: buffer });
    buffer = "";
  };

  while (i < text.length) {
    if (text[i] === "\\" && !isEscaped(text, i)) {
      const pair = text.slice(i, i + 2);
      if (pair === "\\(" || pair === "\\[") {
        const closeToken = pair === "\\(" ? "\\)" : "\\]";
        const end = findUnescaped(text, closeToken, i + 2);
        if (end > 0) {
          const content = text.slice(i + 2, end).trim();
          if (content && content.length <= LATEX_MAX_LENGTH) {
            flush();
            out.push({ type: "math", mode: pair === "\\(" ? "inline" : "block", value: content });
            i = end + closeToken.length;
            continue;
          }
        }
      }

      const beginMatch = /^\\begin\{([A-Za-z*]+)\}/.exec(text.slice(i));
      if (beginMatch) {
        const endToken = `\\end{${beginMatch[1]}}`;
        const end = findUnescaped(text, endToken, i + beginMatch[0].length);
        if (end > 0) {
          const content = text.slice(i, end + endToken.length);
          if (content.length <= LATEX_MAX_LENGTH) {
            flush();
            out.push({ type: "math", mode: "block", value: content });
            i = end + endToken.length;
            continue;
          }
        }
      }
    }

    if (text[i] === "$" && !isEscaped(text, i)) {
      const isBlock = text[i + 1] === "$";
      const token = isBlock ? "$$" : "$";
      const found = findDollarClose(text, i + token.length, token, i);
      if (found) {
        flush();
        out.push({ type: "math", mode: isBlock ? "block" : "inline", value: found.content });
        i = found.end + token.length;
        continue;
      }
    }

    buffer += text[i];
    i += 1;
  }

  flush();
  return out;
}

/** 第二遍：在纯文本片段里找裸 LaTeX */
function splitByBareLatex(text) {
  const out = [];
  const pattern = /\\[A-Za-z]+/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (!MATH_COMMANDS.has(match[0].slice(1))) continue;
    if (isEscaped(text, match.index)) continue;

    let start = expandLeft(text, match.index);
    let end = expandRight(text, match.index + match[0].length);

    // 用「移动边界」而不是裁剪字符串，避免把裁掉的字符弄丢
    while (start < end && /[\s,.;:]/.test(text[start])) start += 1;
    while (end > start && /[\s,.;:]/.test(text[end - 1])) end -= 1;
    // 左向扩张可能留下了未闭合的 `{`，把尾部对应的 `}` 补齐
    end = balanceTrailingBraces(text, start, end);
    // 紧贴命令的英文单词（如 foo\alpha）不算公式的一部分
    const glued = /^([A-Za-z]{2,})\\/.exec(text.slice(start, end));
    if (glued) start += glued[1].length;
    // 首部散文词（`Newton's law \vec{F}` 里的 `Newton's law`）。
    // 先要求一个 4 字母以上的词作为"散文信号"，成立后才继续吃掉较短的词 ——
    // 这样 `Newton's law` 两个词都能去掉，而 `mol \times N` 里的 `mol` 会留下。
    const firstWord = /^[A-Za-z]{4,}[A-Za-z'’\u2019-]*\s+/.exec(text.slice(start, end));
    if (firstWord) {
      start += firstWord[0].length;
      while (start < end) {
        const word = /^[A-Za-z]{2,}[A-Za-z'’\u2019-]*\s+/.exec(text.slice(start, end));
        if (!word) break;
        start += word[0].length;
      }
    }
    // 尾部散文词（如 `\alpha coefficient` 里的 `coefficient`），阈值取 5：
    // `kT` / `mol` / `BIL` 这类短记号必须留住。
    // 但若剩下的部分以运算符结尾（`\sum m\vec v= const`），
    // 那个"单词"其实是公式的一部分，也要留住。
    const tail = /(?:\s+[A-Za-z]{5,}[A-Za-z'’\u2019-]*)+$/.exec(text.slice(start, end));
    if (tail && !/[=+\-*/<>]$/.test(text.slice(start, start + tail.index))) {
      end = start + tail.index;
    }
    while (end > start && /[\s,.;:]/.test(text[end - 1])) end -= 1;

    if (start >= end) continue;

    // ⚠️ 左向扩张可能伸回**已经切走**的片段里，此时不能整条丢弃。
    // `M_{\mathrm{O_2}}=32\times10^{-3}` 就是典型：右向扩张从 `\mathrm` 出发时
    // 不知道左边还挂着一个未闭合的 `{`，于是在第二个 `}` 处提前收尾
    // （balanceTrailingBraces 只补回一个），前半截 `M_{\mathrm{O_2}}` 先被切走；
    // 轮到 `\times` 时它的左向扩张会一路够到 `M`，落在 cursor 之前被判越界，
    // 结果后半截 `=32\times10^{-3}` 永远漏识别。
    // 所以把起点**夹到 cursor** 再判一次。
    if (start < cursor) {
      start = cursor;
      while (start < end && /[\s,.;:]/.test(text[start])) start += 1;
    }
    if (start >= end) continue;

    const fragment = text.slice(start, end);
    if (!isMeaningfulLatex(fragment)) continue;

    if (start > cursor) out.push({ type: "text", value: text.slice(cursor, start) });
    out.push({ type: "math", mode: "inline", value: fragment });
    cursor = end;
  }

  if (!out.length) return [{ type: "text", value: text }];
  if (cursor < text.length) out.push({ type: "text", value: text.slice(cursor) });

  // 夹起点会留下**相邻**的两个 math 片段（如 `M_{\mathrm{O_2}}` + `=32\times10^{-3}`）。
  // 它们本来就是同一条公式被 `}` 断开的产物，合回去渲染更自然，也少一层 KaTeX DOM。
  const merged = [];
  for (const part of out) {
    const prev = merged[merged.length - 1];
    if (part.type === "math" && prev && prev.type === "math") {
      prev.value += part.value;
      continue;
    }
    merged.push({ ...part });
  }
  return merged;
}

/**
 * 把一段文本切成 `{ type: "text" | "math" }` 片段。
 * 没有任何公式时返回 `null`，调用方据此跳过 —— 避免无谓的 DOM 改写。
 *
 * 纯函数、不碰 DOM，所以可以在 Node 里直接单测。
 */
export function scanLatexInText(text) {
  const source = String(text ?? "");
  if (!source || (!source.includes("$") && !source.includes("\\"))) return null;

  const pieces = [];
  let found = false;
  for (const piece of splitByDelimiters(source)) {
    if (piece.type === "math") {
      pieces.push(piece);
      found = true;
      continue;
    }
    for (const inner of splitByBareLatex(piece.value)) {
      if (inner.type === "math") found = true;
      pieces.push(inner);
    }
  }
  return found ? pieces : null;
}

/**
 * 块级公式不能待在 `<p>` 里 —— HTML 解析器会把段落截断，重新解析时内容错位。
 * 这里把段落拆成「前段 / 公式 / 后段」，和 utils/markdown.js 处理图片的方式一致。
 */
function hoistBlocksOutOfParagraphs(documentNode) {
  let guard = 0;
  while (guard < 500) {
    guard += 1;
    const block = documentNode.body?.querySelector('p > div[data-life-math="block"]');
    if (!block) return;
    const paragraph = block.parentElement;
    const container = paragraph?.parentNode;
    if (!container) return;

    const before = documentNode.createElement("p");
    const after = documentNode.createElement("p");
    let reached = false;
    for (const child of Array.from(paragraph.childNodes)) {
      if (child === block) {
        reached = true;
        continue;
      }
      (reached ? after : before).appendChild(child);
    }
    const parts = [];
    if (before.textContent.trim() || before.children.length) parts.push(before);
    parts.push(block);
    if (after.textContent.trim() || after.children.length) parts.push(after);
    paragraph.replaceWith(...parts);
  }
}

function piecesToFragment(pieces, documentNode) {
  const fragment = documentNode.createDocumentFragment();
  for (const piece of pieces) {
    if (piece.type !== "math") {
      fragment.appendChild(documentNode.createTextNode(piece.value));
      continue;
    }
    const element = documentNode.createElement(piece.mode === "block" ? "div" : "span");
    element.setAttribute("data-life-math", piece.mode);
    element.setAttribute("data-latex", piece.value);
    element.textContent = piece.value;
    fragment.appendChild(element);
  }
  return fragment;
}

/**
 * 扫描 `documentNode` 里的文本节点，把 LaTeX 升级成公式节点。
 *
 * 只改文本节点、不碰任何已有元素，所以对编辑器（Slate 自己管 DOM）
 * 和已发布内容都安全。返回升级的文本节点数量。
 */
export function upgradeTextLatex(documentNode) {
  const body = documentNode?.body;
  if (!body || typeof documentNode.createTreeWalker !== "function") return 0;

  const targets = [];
  const walker = documentNode.createTreeWalker(body, 4, {
    acceptNode(node) {
      const value = node.nodeValue;
      if (!value || !value.trim()) return 3;
      if (!value.includes("$") && !value.includes("\\")) return 3;
      const parent = node.parentElement;
      if (!parent) return 3;
      if (parent.closest(SKIP_SELECTOR)) return 2;
      return 1;
    },
  });
  while (walker.nextNode()) targets.push(walker.currentNode);

  let changed = 0;
  for (const node of targets) {
    if (!node.parentNode) continue;
    const pieces = scanLatexInText(node.nodeValue);
    if (!pieces) continue;
    node.parentNode.replaceChild(piecesToFragment(pieces, documentNode), node);
    changed += 1;
  }
  if (changed) hoistBlocksOutOfParagraphs(documentNode);
  return changed;
}

/**
 * 找出源码里「不该被改写」的区间：围栏代码块与行内代码。
 * 返回 `[start, end)` 区间列表，供偏移量判断使用 ——
 * 不做占位符替换，避免破坏 micromark 的转义规则与后续 sanitize。
 */
function codeRanges(source) {
  const ranges = [];
  const lines = [];
  let offset = 0;
  for (const text of source.split("\n")) {
    lines.push({ start: offset, text });
    offset += text.length + 1;
  }

  let fenceChar = "";
  let fenceLength = 0;
  for (const line of lines) {
    const marker = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(line.text);
    if (marker) {
      const char = marker[1][0];
      const length = marker[1].length;
      if (fenceChar && char === fenceChar && length >= fenceLength) {
        fenceChar = "";
        fenceLength = 0;
      } else if (!fenceChar) {
        fenceChar = char;
        fenceLength = length;
      }
      ranges.push([line.start, line.start + line.text.length]);
      continue;
    }
    if (fenceChar) {
      ranges.push([line.start, line.start + line.text.length]);
      continue;
    }

    let i = 0;
    while (i < line.text.length) {
      if (line.text[i] === "`") {
        const run = /^`+/.exec(line.text.slice(i))[0];
        const close = line.text.indexOf(run, i + run.length);
        if (close >= 0) {
          ranges.push([line.start + i, line.start + close + run.length]);
          i = close + run.length;
          continue;
        }
      }
      i += 1;
    }
  }
  return ranges;
}

/**
 * Markdown 源码的前置归一化。
 *
 * CommonMark 把 `\(` `\)` `\[` `\]` 当成**反斜杠转义**，会把反斜杠吃掉 ——
 * 于是 LaTeX 风格的 `\(a_t=1\)` 到了输出里变成 `(a_t=1)`，公式源码直接损坏。
 * `micromark-extension-math` 只认 `$` 系定界符，所以这里先把 LaTeX 风格
 * 归一成 `$…$` / `$$…$$`，再交给 micromark。
 *
 * 代码块与行内代码里的内容按区间跳过，不改动。
 */
export function normalizeLatexDelimiters(source) {
  const text = String(source ?? "");
  if (!text.includes("\\(") && !text.includes("\\[")) return text;

  const ranges = codeRanges(text);
  const blocked = (index, length) =>
    ranges.some(([start, end]) => index < end && index + length > start);

  const pattern = /(?<!\\)\\\[([\s\S]*?)(?<!\\)\\\]|(?<!\\)\\\(([\s\S]*?)(?<!\\)\\\)/g;
  let out = "";
  let cursor = 0;
  let match;
  let hit = false;

  while ((match = pattern.exec(text))) {
    if (blocked(match.index, match[0].length)) continue;
    hit = true;
    out += text.slice(cursor, match.index);
    if (match[1] !== undefined) {
      const body = match[1].trim();
      out += body ? `\n$$\n${body}\n$$\n` : "";
    } else {
      const body = match[2].trim();
      out += body ? `$${body}$` : "";
    }
    cursor = match.index + match[0].length;
  }

  return hit ? out + text.slice(cursor) : text;
}
