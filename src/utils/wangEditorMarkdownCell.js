/**
 * 工具栏菜单：「插入 Markdown 单元格」。
 *
 * 与「从 Markdown 导入正文」（wangEditorToolbarMenus.js 的 lifeImportMarkdown）**并存**：
 *   - 导入：开弹窗，粘一整篇 Markdown，转成正文 HTML 一次性插进去（源码不留）；
 *   - 单元格：在光标处放一个可反复编辑、可随时预览的 md 块（源码留在文档里）。
 *
 * 注册方式与 wangEditorCodeSample.js 完全一致（Boot.registerMenu），
 * 这样它能和别的入口一起排进 `toolbarKeys`，不会在工具栏里多出一块独立 DOM。
 */
import { Boot, DomEditor, SlateRange, SlateTransforms } from "@wangeditor/editor";
import {
  MARKDOWN_CELL_LANGUAGE,
  createMarkdownCellNode,
} from "./markdownCell.js";

export const MD_CELL_MENU_KEY = "lifeMarkdownCell";

/** 实心「M」：Markdown 单元格 */
const mdCellIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M160 832V192h160l192 256 192-256h160v640H704V480L512 736 320 480v352H160z"></path>
  </svg>`;

/**
 * 在光标处插入一个空的 Markdown 单元格，并把光标送进单元格里，
 * 作者可以直接开写，不用再点一次。
 *
 * 末尾那个空段落是必要的：`pre` 是块级节点，后面留一个段落，
 * 否则插入后没有落点可以继续写正文（和 insertCodeSampleBlock 同一考虑）。
 */
export function insertMarkdownCell(editor, source = "") {
  if (!editor) return false;
  const nodes = [createMarkdownCellNode(source), DomEditor.genEmptyParagraph()];

  if (editor.selection === null && typeof editor.focus === "function") {
    editor.focus();
  }
  if (editor.selection === null) editor.restoreSelection?.();

  if (editor.selection !== null) {
    const anchorIndex = editor.selection.anchor.path[0];
    SlateTransforms.insertNodes(editor, nodes, { select: true });
    focusCellText(editor, anchorIndex);
    return true;
  }

  const children = editor.children || [];
  if (children.length === 0) return false;
  try {
    SlateTransforms.insertNodes(editor, nodes, {
      at: [children.length],
      select: true,
    });
    focusCellText(editor, children.length);
    return true;
  } catch {
    return false;
  }
}

/**
 * 插入后把光标送进单元格的源码里，作者可以直接开写。
 *
 * ⚠️ 不能直接用「插入前光标所在的顶层下标」：实测在空段落里插入块级节点时，
 * 新节点是插在那个段落**之后**的（`[p]` → `[p, pre, p]`），下标并不相等 ——
 * 按老下标设选区，打字会全部落回上面的段落，单元格始终是空的。
 * 所以从插入位置往后找第一个 md 单元格，那才是刚插进去的那个。
 *
 * 另外**顺序必须是 `focus()` → `select()`**：
 *   - 先 focus 让 contenteditable 拿到 DOM 焦点（点工具栏按钮时焦点在按钮上）；
 *   - 再 select 设 slate 选区。
 * 反过来不行。也**别用 `restoreSelection()`** —— 它读的是编辑器内部缓存的旧选区
 * （core 里就是 `focus(); select(editor, 缓存的 selection)`），会把刚设好的光标冲掉。
 */
function focusCellText(editor, fromIndex) {
  const children = editor.children || [];
  let index = -1;
  for (let i = Math.max(0, Number(fromIndex) || 0); i < children.length; i += 1) {
    const node = children[i];
    if (node?.type !== "pre") continue;
    if (node.children?.[0]?.language !== MARKDOWN_CELL_LANGUAGE) continue;
    index = i;
    break;
  }
  if (index < 0) return;

  try {
    editor.focus?.();
    SlateTransforms.select(editor, { path: [index, 0, 0], offset: 0 });
  } catch {
    // 插入位置不在顶层（比如在某个列表里）时算不出路径，忽略即可，
    // 光标会停在插入的节点后面，作者点一下单元格照样能写。
  }
}

class MarkdownCellMenu {
  title = "插入 Markdown 单元格（Shift + Enter 预览）";
  iconSvg = mdCellIcon;
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
    insertMarkdownCell(editor);
  }
}

export function registerMarkdownCellModule() {
  try {
    Boot.registerMenu({
      key: MD_CELL_MENU_KEY,
      factory: () => new MarkdownCellMenu(),
    });
  } catch (error) {
    // 热更新时重复注册会抛错，键名相同即可忽略（与其它 register* 的写法一致）
    if (!String(error?.message || error).includes(MD_CELL_MENU_KEY)) throw error;
  }
}
