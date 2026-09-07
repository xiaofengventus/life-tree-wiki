import { Boot } from "@wangeditor/editor";

export const INSERT_MENU_KEY = "lifeInsertContent";
export const INSERT_MENU_EVENT = "life-open-insert-content";

const insertIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M456 112h112v344h344v112H568v344H456V568H112V456h344V112z"></path>
  </svg>`;

class InsertContentMenu {
  title = "插入内容";
  iconSvg = insertIcon;
  hotkey = "mod+shift+i";
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
    editor.hidePanelOrModal();
    window.dispatchEvent(new CustomEvent(INSERT_MENU_EVENT, {
      detail: { editor },
    }));
  }
}

let registered = false;

export function registerInsertContentMenu() {
  if (registered) return;
  try {
    Boot.registerMenu({
      key: INSERT_MENU_KEY,
      factory: () => new InsertContentMenu(),
    });
  } catch (error) {
    if (!String(error?.message || error).includes(INSERT_MENU_KEY)) throw error;
  }
  registered = true;
}
