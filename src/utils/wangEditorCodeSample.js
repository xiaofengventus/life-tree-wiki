import { Boot, DomEditor, SlateRange, SlateTransforms } from "@wangeditor/editor";
import { CODE_SAMPLE_LANGUAGE } from "./codeSample.js";

export const CODE_SAMPLE_MENU_KEY = "lifeCodeSample";

let registered = false;

const sampleIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M112 168h368v112H224v464h256v112H112V168zm432 0h368v688H544v-112h256V280H544V168zM300 396h92v232h-92V396zm332 0h92v232h-92V396z"></path>
  </svg>`;

/** 点一下按钮就相当于插入一个已经写好结构的代码块 */
const CODE_SAMPLE_TEMPLATE = [
  "5",
  "11 22 33 44 55",
  "0 2",
  "1 4",
  "---",
  "11 22 33 44 55",
  "33 44 55 11 22",
  "44 55 11 22 33",
].join("\n");

/**
 * 代码块节点形状：`pre` 包一个 `code`，语言写在 code 上。
 * 这与 wangEditor 内置解析器的输出一致，序列化时语言会写成
 * `class="language-sample"`，阅读页据此升级成卡片。
 */
function codeSampleNode(text) {
  return {
    type: "pre",
    children: [
      {
        type: "code",
        language: CODE_SAMPLE_LANGUAGE,
        children: [{ text: String(text ?? "") }],
      },
    ],
  };
}

export function insertCodeSampleBlock(editor, text = CODE_SAMPLE_TEMPLATE) {
  if (!editor) return false;
  const nodes = [codeSampleNode(text), DomEditor.genEmptyParagraph()];

  if (editor.selection === null && typeof editor.focus === "function") {
    editor.focus();
  }
  if (editor.selection === null) editor.restoreSelection?.();

  if (editor.selection !== null) {
    SlateTransforms.insertNodes(editor, nodes, { select: true });
    return true;
  }

  const children = editor.children || [];
  if (children.length === 0) return false;
  try {
    SlateTransforms.insertNodes(editor, nodes, {
      at: [children.length],
      select: true,
    });
    return true;
  } catch {
    return false;
  }
}

class CodeSampleMenu {
  title = "代码块案例";
  iconSvg = sampleIcon;
  tag = "button";

  getValue() {
    return "";
  }

  isActive() {
    return false;
  }

  isDisabled(editor) {
    return editor.isDisabled();
  }

  exec(editor) {
    if (editor.selection && SlateRange.isExpanded(editor.selection)) {
      const [, end] = SlateRange.edges(editor.selection);
      editor.select(end);
    }
    editor.hidePanelOrModal();
    insertCodeSampleBlock(editor);
  }
}

export function registerCodeSampleModule() {
  if (registered) return;
  try {
    Boot.registerMenu({
      key: CODE_SAMPLE_MENU_KEY,
      factory: () => new CodeSampleMenu(),
    });
  } catch (error) {
    if (!String(error?.message || error).includes(CODE_SAMPLE_MENU_KEY)) throw error;
  }
  registered = true;
}
