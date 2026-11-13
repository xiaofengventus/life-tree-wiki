// Laup 诊断：错误与警告都带行号。
// 设计原则（沿用 latexScan.js 的教训）：能降级的不报错（给 warning），
// 结构错了才报错（throw），且必须能指到具体行。

export class LaupError extends Error {
  constructor(message, line, hint, span) {
    super(message);
    this.name = 'LaupError';
    this.line = line == null ? null : line;
    this.hint = hint || '';
    // 出错的这个构造占了几行源码。
    //   null  = 让容错模式自己估（多行结构用，见 scanner.js 的 guessSpan）
    //   数字  = 明确告诉它（单行错误写 1，未闭合的围栏写实际跨度）
    this.span = span == null ? null : span;
  }

  toString() {
    const at = this.line == null ? '' : `第 ${this.line} 行：`;
    const tip = this.hint ? `\n  提示：${this.hint}` : '';
    return `${at}${this.message}${tip}`;
  }
}

export function makeCtx(opts = {}) {
  return {
    warnings: [],
    // 编辑期（true）出错不抛异常，改成产出 Broken 节点 + 记诊断。
    // 编译期（false，默认）保持原样抛错 —— 写错了必须知道。见 scanner.js。
    tolerant: !!(opts && opts.tolerant),
    warn(line, message) {
      this.warnings.push({ line, message });
    },
    // 把诊断绑定到某一行，供更深层（行内解析、数据块）直接用 ctx.warn(msg)
    at(line) {
      const self = this;
      return {
        line,
        warn(message, ln) {
          self.warnings.push({ line: ln == null ? line : ln, message });
        },
      };
    },
  };
}
