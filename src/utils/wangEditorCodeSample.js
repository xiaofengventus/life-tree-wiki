import { Boot, DomEditor, SlateRange, SlateTransforms } from "@wangeditor/editor";
import { CODE_SAMPLE_LANGUAGE } from "./codeSample.js";

export const CODE_SAMPLE_MENU_KEY = "lifeCodeSample";

let registered = false;

const sampleIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M112 168h368v112H224v464h256v112H112V168zm432 0h368v688H544v-112h256V280H544V168zM300 396h92v232h-92V396zm332 0h92v232h-92V396z"></path>
  </svg>`;

/**
 * 点一下按钮就插入一个**空白**的「代码块案例」骨架 —— 不带任何示例数据。
 *
 * 之前这里塞了一段示范用的输入 / 输出，作者每次都要先把它删干净才能写自己的内容，
 * 所以改成空字符串。分隔符（单独一行 `---` / `===`）由作者按需自己敲：
 * 不写分隔符就是单栏「输入」，写了就是输入 / 输出双栏（见 utils/codeSample.js）。
 */
const CODE_SAMPLE_TEMPLATE = "";

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
