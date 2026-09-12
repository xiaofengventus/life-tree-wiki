/**
 * 工具栏提示（tooltip）里的快捷键文案。
 *
 * 编辑器工具栏（EditorToolbar.vue）和插入悬浮条（create_post.vue）都要显示快捷键，
 * 所以放在这里共用，避免两处各写一份。
 */

export function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  const platform =
    navigator.userAgentData?.platform || navigator.platform || "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * `mod+B` → `Ctrl + B`（macOS 为 `⌘ + B`）。
 * `redo` 是特例：Windows 下 Ctrl+Y 与 Ctrl+Shift+Z 都可用，一并列出。
 */
export function formatToolbarShortcut(shortcut) {
  if (!shortcut) return "";
  const apple = isApplePlatform();
  if (shortcut === "redo") {
    return apple ? "⌘ + Shift + Z" : "Ctrl + Y / Ctrl + Shift + Z";
  }
  return shortcut
    .replace(/^mod/i, apple ? "⌘" : "Ctrl")
    .split("+")
    .join(" + ");
}
