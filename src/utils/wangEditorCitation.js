import { Boot, SlateRange, SlateTransforms } from "@wangeditor/editor";

export const CITATION_MENU_KEY = "lifeInlineCitation";
export const CITATION_MENU_EVENT = "life-open-inline-citation";

const citationIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M120 152h190v92H212v536h98v92H120V152zm714 0h70v720H714v-92h98V244h-98v-92h120zM430 330h70v364h94v82H344v-82h86V436l-76 42v-94l76-54z"></path>
  </svg>`;

class InlineCitationMenu {
  title = "插入正文引用";
  iconSvg = citationIcon;
  hotkey = "mod+alt+k";
  tag = "button";

  getValue() {
    return "";
  }

  isActive() {
    return false;
  }

  isDisabled(editor) {
    return editor.isDisabled() || !editor.selection;
  }

  exec(editor) {
    if (editor.selection && SlateRange.isExpanded(editor.selection)) {
      const [, end] = SlateRange.edges(editor.selection);
      editor.select(end);
    }
    editor.hidePanelOrModal();
    window.dispatchEvent(new CustomEvent(CITATION_MENU_EVENT, {
      detail: { editor },
    }));
  }
}

let registered = false;

export function registerCitationMenu() {
  if (registered) return;
  try {
    Boot.registerMenu({
      key: CITATION_MENU_KEY,
      factory: () => new InlineCitationMenu(),
    });
  } catch (error) {
    if (!String(error?.message || error).includes(CITATION_MENU_KEY)) throw error;
  }
  registered = true;
}

export function insertCitationMarker(editor, number) {
  const citationNumber = Number(number);
  if (
    !editor ||
    !Number.isSafeInteger(citationNumber) ||
    citationNumber < 1 ||
    citationNumber > 9_999
  ) return false;

  if (editor.selection === null) editor.restoreSelection();
  if (editor.selection === null) return false;

  SlateTransforms.insertNodes(editor, {
    type: "link",
    url: `#post-citation-${citationNumber}`,
    target: "",
    children: [{
      text: `[${citationNumber}]`,
      sup: true,
    }],
  });
  editor.removeMark("sup");
  editor.insertFragment([{ text: "\u200B" }]);
  return true;
}
