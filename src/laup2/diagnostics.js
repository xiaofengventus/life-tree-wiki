/**
 * Laup v2 —— 诊断。
 *
 * 任何"看不懂但不想丢"的东西都产出诊断 + Broken 节点，而不是静默吞掉。
 * span 是源码行号区间，前端可以直接定位到行。
 */

export class Diagnostic {
  constructor(code, message, span = null, level = "warning") {
    this.code = code;
    this.message = message;
    this.span = span;
    this.level = level;
  }

  toString() {
    let at = "";
    if (Array.isArray(this.span)) {
      at = `第 ${this.span[0]}${this.span[1] !== this.span[0] ? `-${this.span[1]}` : ""} 行`;
    } else if (this.span && this.span.line) {
      at = `第 ${this.span.line} 行第 ${this.span.column} 列`;
    } else if (this.span && this.span.start !== undefined) {
      at = `字符 ${this.span.start}-${this.span.end}`;
    }
    return `[${this.level}] ${this.code} ${at} ${this.message}`.trim();
  }
}

export function createDiagnostics(target = []) {
  return {
    list: target,
    warn(code, message, span) {
      target.push(new Diagnostic(code, message, span, "warning"));
    },
    error(code, message, span) {
      target.push(new Diagnostic(code, message, span, "error"));
    },
  };
}

/** 生成一段可读的诊断文本（测试/CLI 用） */
export function formatDiagnostics(list) {
  return (list || []).map((item) => item.toString()).join("\n");
}
