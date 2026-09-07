import {
  Boot,
  DomEditor,
  SlateEditor,
  SlatePath,
  SlatePoint,
  SlateRange,
  SlateTransforms,
} from "@wangeditor/editor";

const REGISTRATION_FLAG = "__lifeEditorUxModuleRegistered";

function withEditorUx(editor) {
  const { insertText, normalizeNode } = editor;

  editor.insertText = (text) => {
    const link = DomEditor.getSelectedNodeByType(editor, "link");
    const selection = editor.selection;
    if (link && selection && SlateRange.isCollapsed(selection)) {
      const path = DomEditor.findPath(editor, link);
      const end = SlateEditor.end(editor, path);
      if (SlatePoint.equals(selection.anchor, end)) {
        const nextPath = SlatePath.next(path);
        SlateTransforms.insertNodes(editor, { text: "" }, { at: nextPath });
        SlateTransforms.select(editor, { path: nextPath, offset: 0 });
      }
    }
    insertText(text);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (
      DomEditor.getNodeType(node) === "blockquote" &&
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

export function registerEditorUxModule() {
  if (globalThis[REGISTRATION_FLAG]) return;
  Boot.registerModule({ editorPlugin: withEditorUx });
  globalThis[REGISTRATION_FLAG] = true;
}
