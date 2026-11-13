import {
  Boot,
  DomEditor,
  SlateTransforms,
} from "@wangeditor/editor";
import { h } from "snabbdom";
import { cleanLatex, renderLatex } from "./formula";

export const FORMULA_INLINE_TYPE = "life-formula-inline";
export const FORMULA_BLOCK_TYPE = "life-formula-block";
export const FORMULA_MENU_KEY = "lifeFormula";
export const FORMULA_MENU_EVENT = "life-open-formula";

const REGISTRATION_FLAG = "__lifeFormulaModuleRegistered";
const formulaIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M152 170h694v112H444l166 230-166 230h402v112H224l246-342-246-342h-72z"></path>
  </svg>`;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isBlockFormula(node) {
  return node?.type === FORMULA_BLOCK_TYPE;
}

function renderFormula(elemNode, _children, editor) {
  const latex = cleanLatex(elemNode.latex);
  const displayMode = isBlockFormula(elemNode);
  const selected = DomEditor.isNodeSelected(editor, elemNode);
  return h(
    displayMode ? "div" : "span",
    {
      attrs: {
        "data-w-e-type": elemNode.type,
        "data-life-math": displayMode ? "block" : "inline",
        contenteditable: "false",
        title: "双击编辑公式",
      },
      class: {
        "life-formula-editor-node": true,
        "life-math-block": displayMode,
        "life-math-inline": !displayMode,
        "is-selected": selected && !editor.isDisabled(),
      },
      props: {
        innerHTML: renderLatex(latex, displayMode),
      },
      on: {
        dblclick(event) {
          event.preventDefault();
          window.dispatchEvent(new CustomEvent(FORMULA_MENU_EVENT, {
            detail: { editor, formula: elemNode },
          }));
        },
      },
    },
  );
}

function formulaToHtml(elemNode) {
  const latex = cleanLatex(elemNode.latex);
  const displayMode = isBlockFormula(elemNode);
  const tag = displayMode ? "div" : "span";
  const mode = displayMode ? "block" : "inline";
  const safeLatex = escapeHtml(latex);
  return `<${tag} data-life-math="${mode}" data-latex="${safeLatex}">${safeLatex}</${tag}>`;
}

function parseFormula(element) {
  const displayMode = element.getAttribute("data-life-math") === "block";
  return {
    type: displayMode ? FORMULA_BLOCK_TYPE : FORMULA_INLINE_TYPE,
    latex: cleanLatex(element.getAttribute("data-latex") || element.textContent),
    children: [{ text: "" }],
  };
}

function withFormula(editor) {
  const { isInline, isVoid, normalizeNode } = editor;
  editor.isInline = (element) =>
    element.type === FORMULA_INLINE_TYPE ? true : isInline(element);
  editor.isVoid = (element) =>
    element.type === FORMULA_INLINE_TYPE || element.type === FORMULA_BLOCK_TYPE
      ? true
      : isVoid(element);
  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (
      node?.type === FORMULA_BLOCK_TYPE &&
      DomEditor.isLastNode(editor, node)
    ) {
      SlateTransforms.insertNodes(editor, DomEditor.genEmptyParagraph(), {
        at: [path[0] + 1],
      });
      return;
    }
    normalizeNode(entry);
  };
  return editor;
}

class FormulaMenu {
  title = "插入数学公式";
  iconSvg = formulaIcon;
  hotkey = "mod+alt+m";
  tag = "button";

  getValue() {
    return "";
  }

  isActive(editor) {
    return Boolean(getSelectedFormula(editor));
  }

  isDisabled(editor) {
    return editor.isDisabled() || !editor.selection;
  }

  exec(editor) {
    editor.hidePanelOrModal();
    window.dispatchEvent(new CustomEvent(FORMULA_MENU_EVENT, {
      detail: { editor, formula: getSelectedFormula(editor) },
    }));
  }
}

/**
 * 行内公式必须带上 `data-w-e-type` 才解析得出来。
 *
 * wangEditor core 的元素分发（`parseElemHtml` 上游）是这样判的：
 *
 *     tag === "span" ? (有 data-w-e-type ? 元素分支 : 行内文本分支) : ...
 *
 * **`<span>` 一旦没有 `data-w-e-type`，就直接走「行内文本」分支**，
 * 该分支只取 `textContent` —— 我们注册在 `parseElemsHtml` 里的
 * `span[data-life-math="inline"]` 规则**根本不会被查询**。
 *
 * 后果就是行内公式被拍扁成裸文本：`<span data-latex="E=mc^2">` → `E=mc^2`。
 * 块级公式是 `<div>`，天然走元素分支，所以一直正常 ——
 * 这就是「块级能渲染、行内丢公式」这种不对称现象的根因。
 *
 * 这里在解析前补上该属性，把它带回元素分支；属性只在内存里加，
 * 序列化仍由 formulaToHtml 产出，**存储格式不变**。
 */
function tagInlineFormulaForParse(element) {
  if (element?.getAttribute && !element.getAttribute("data-w-e-type")) {
    element.setAttribute("data-w-e-type", FORMULA_INLINE_TYPE);
  }
  return element;
}

const formulaModule = {
  renderElems: [
    { type: FORMULA_INLINE_TYPE, renderElem: renderFormula },
    { type: FORMULA_BLOCK_TYPE, renderElem: renderFormula },
  ],
  elemsToHtml: [
    { type: FORMULA_INLINE_TYPE, elemToHtml: formulaToHtml },
    { type: FORMULA_BLOCK_TYPE, elemToHtml: formulaToHtml },
  ],
  preParseHtml: [
    {
      selector: 'span[data-life-math="inline"]',
      preParseHtml: tagInlineFormulaForParse,
    },
  ],
  parseElemsHtml: [
    {
      selector: 'span[data-life-math="inline"]',
      parseElemHtml: parseFormula,
    },
    {
      selector: 'div[data-life-math="block"],p[data-life-math="block"]',
      parseElemHtml: parseFormula,
    },
  ],
  menus: [{
    key: FORMULA_MENU_KEY,
    factory: () => new FormulaMenu(),
  }],
  editorPlugin: withFormula,
};

export function registerFormulaModule() {
  if (globalThis[REGISTRATION_FLAG]) return;
  Boot.registerModule(formulaModule);
  globalThis[REGISTRATION_FLAG] = true;
}

export function getSelectedFormula(editor) {
  return (
    DomEditor.getSelectedNodeByType(editor, FORMULA_INLINE_TYPE) ||
    DomEditor.getSelectedNodeByType(editor, FORMULA_BLOCK_TYPE) ||
    null
  );
}

export function insertOrUpdateFormula(editor, { latex, displayMode = false, existing = null }) {
  const source = cleanLatex(latex);
  if (!editor || !source) return false;
  if (editor.selection === null) editor.restoreSelection();
  if (editor.selection === null) return false;

  const selected = existing || getSelectedFormula(editor);
  if (selected) {
    SlateTransforms.setNodes(
      editor,
      { latex: source },
      { at: DomEditor.findPath(editor, selected) },
    );
    return true;
  }

  const type = displayMode ? FORMULA_BLOCK_TYPE : FORMULA_INLINE_TYPE;
  if (displayMode) {
    SlateTransforms.insertNodes(editor, [{
      type,
      latex: source,
      children: [{ text: "" }],
    }, DomEditor.genEmptyParagraph()], { select: true });
  } else {
    SlateTransforms.insertNodes(editor, {
      type,
      latex: source,
      children: [{ text: "" }],
    });
    editor.insertFragment([{ text: "\u200B" }]);
  }
  return true;
}
