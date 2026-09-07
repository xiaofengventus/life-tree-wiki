const MAX_FORMULA_LENGTH = 4_000;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formulaHtml(value, displayMode) {
  const latex = String(value || "").trim();
  if (!latex) return "";
  if (latex.length > MAX_FORMULA_LENGTH) {
    throw new Error("单个公式不能超过 4000 个字符");
  }
  const tag = displayMode ? "div" : "span";
  const mode = displayMode ? "block" : "inline";
  const safeLatex = escapeHtml(latex);
  return `<${tag} data-life-math="${mode}" data-latex="${safeLatex}">${safeLatex}</${tag}>`;
}

export function mathSourceHtml() {
  return {
    enter: {
      mathFlow() {
        this.lineEndingIfNeeded();
      },
      mathFlowFenceMeta() {
        this.buffer();
      },
      mathText() {
        this.buffer();
      },
    },
    exit: {
      mathFlow() {
        const value = this.resume().replace(/(?:\r?\n|\r)$/, "");
        this.tag(formulaHtml(value, true));
        this.setData("mathFlowOpen");
        this.setData("slurpOneLineEnding");
      },
      mathFlowFence() {
        if (!this.getData("mathFlowOpen")) {
          this.setData("mathFlowOpen", true);
          this.setData("slurpOneLineEnding", true);
          this.buffer();
        }
      },
      mathFlowFenceMeta() {
        this.resume();
      },
      mathFlowValue(token) {
        this.raw(this.sliceSerialize(token));
      },
      mathText(token) {
        const value = this.resume();
        const fence = this.sliceSerialize(token).match(/^\$+/)?.[0]?.length || 1;
        this.tag(formulaHtml(value, fence > 1));
      },
      mathTextData(token) {
        this.raw(this.sliceSerialize(token));
      },
    },
  };
}
