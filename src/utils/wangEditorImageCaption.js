import {
  Boot,
  DomEditor,
  SlateTransforms,
} from "@wangeditor/editor";
import { h } from "snabbdom";

export const IMAGE_CAPTION_TYPE = "life-image-caption";
const REGISTRATION_FLAG = "__lifeImageCaptionModuleRegistered";
export const IMAGE_CAPTION_MENU_KEY = "lifeEditImageCaption";
export const IMAGE_CAPTION_MENU_EVENT = "life-edit-image-caption";

function cleanCaption(value) {
  return String(value || "").trim().slice(0, 200);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderImageCaption(elemNode, _children, editor) {
  const src = String(elemNode.src || "");
  const caption = cleanCaption(elemNode.caption);
  const alt = cleanCaption(elemNode.alt || caption);
  const selected = DomEditor.isNodeSelected(editor, elemNode);

  return h(
    "figure",
    {
      attrs: {
        "data-w-e-type": IMAGE_CAPTION_TYPE,
      },
      class: {
        "life-image-caption-block": true,
        "is-selected": selected && !editor.isDisabled(),
      },
      on: {
        blur(event) {
          event.stopPropagation();
          const caption = String(event.target.textContent || "").trim().slice(0, 200);
          elemNode.caption = caption;
          elemNode.alt = caption;
          SlateTransforms.setNodes(editor, {
            caption,
            alt: caption,
          }, { at: DomEditor.findPath(editor, elemNode) });
        },
      },
    },
    [
      h("img", {
        attrs: {
          src,
          alt,
          draggable: "false",
        },
      }),
      h("figcaption", {
        attrs: {
          contenteditable: "true",
          spellcheck: "false",
          "data-placeholder": "添加图片说明",
        },
        class: { "life-image-caption-text": true, empty: !caption },
        on: {
          input(event) {
            event.stopPropagation();
            elemNode.caption = String(event.target.textContent || "").trim().slice(0, 200);
            elemNode.alt = elemNode.caption;
          },
          keydown(event) {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              event.target.blur();
            }
          },
          mousedown(event) {
            event.stopPropagation();
          },
          click(event) {
            event.stopPropagation();
          },
        },
        hooks: {
          update(_old, vnode) {
            if (document.activeElement !== vnode.elm && vnode.elm.textContent !== caption) {
              vnode.elm.textContent = caption;
            }
            return vnode;
          },
        },
      }, caption),
    ],
  );
}

function imageCaptionToHtml(elemNode) {
  const src = escapeHtml(elemNode.src);
  const caption = escapeHtml(cleanCaption(elemNode.caption));
  const alt = escapeHtml(cleanCaption(elemNode.alt || elemNode.caption));
  return `<figure><img src="${src}" alt="${alt}"><figcaption>${caption}</figcaption></figure>`;
}

function parseImageCaption(element) {
  const image = element.querySelector("img");
  const caption = cleanCaption(element.querySelector("figcaption")?.textContent);
  return {
    type: IMAGE_CAPTION_TYPE,
    src: image?.getAttribute("src") || "",
    alt: cleanCaption(image?.getAttribute("alt") || caption),
    caption,
    children: [{ text: "" }],
  };
}

function withImageCaption(editor) {
  const { isVoid, normalizeNode } = editor;
  editor.isVoid = (element) =>
    element.type === IMAGE_CAPTION_TYPE ? true : isVoid(element);
  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (
      node?.type === IMAGE_CAPTION_TYPE &&
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

class EditImageCaptionMenu {
  title = "修改图片和注释";
  tag = "button";
  iconSvg = `
    <svg viewBox="0 0 1024 1024" aria-hidden="true">
      <path d="M128 176h768v672H128V176zm96 96v480h576V272H224zm80 368 128-150 88 96 104-128 112 182H304zm72-232a64 64 0 1 1 128 0 64 64 0 0 1-128 0z"></path>
    </svg>`;

  getValue() {
    return "";
  }

  isActive() {
    return false;
  }

  isDisabled(editor) {
    return editor.isDisabled() ||
      !DomEditor.getSelectedNodeByType(editor, IMAGE_CAPTION_TYPE);
  }

  exec(editor) {
    const image = DomEditor.getSelectedNodeByType(editor, IMAGE_CAPTION_TYPE);
    if (!image) return;
    editor.hidePanelOrModal();
    window.dispatchEvent(new CustomEvent(IMAGE_CAPTION_MENU_EVENT, {
      detail: { editor, image },
    }));
  }
}

const imageCaptionModule = {
  renderElems: [{
    type: IMAGE_CAPTION_TYPE,
    renderElem: renderImageCaption,
  }],
  elemsToHtml: [{
    type: IMAGE_CAPTION_TYPE,
    elemToHtml: imageCaptionToHtml,
  }],
  parseElemsHtml: [{
    selector: "figure",
    parseElemHtml: parseImageCaption,
  }],
  menus: [{
    key: IMAGE_CAPTION_MENU_KEY,
    factory: () => new EditImageCaptionMenu(),
  }],
  editorPlugin: withImageCaption,
};

export function registerImageCaptionModule() {
  if (globalThis[REGISTRATION_FLAG]) return;
  Boot.registerModule(imageCaptionModule);
  globalThis[REGISTRATION_FLAG] = true;
}

export function insertImageCaptionBlock(editor, { src, caption, alt = "" }) {
  const cleanSrc = String(src || "").trim();
  const cleanText = cleanCaption(caption);
  if (!editor || !cleanSrc || !cleanText) return false;

  if (editor.selection === null) editor.restoreSelection();
  if (editor.selection === null) return false;
  if (DomEditor.getSelectedNodeByType(editor, IMAGE_CAPTION_TYPE)) editor.move(1);

  SlateTransforms.insertNodes(editor, [{
    type: IMAGE_CAPTION_TYPE,
    src: cleanSrc,
    alt: cleanCaption(alt || cleanText),
    caption: cleanText,
    children: [{ text: "" }],
  }, DomEditor.genEmptyParagraph()], { select: true });
  return true;
}

export function updateImageCaptionBlock(editor, image, { src, caption, alt = "" }) {
  const cleanSrc = String(src || "").trim();
  const cleanText = cleanCaption(caption);
  if (!editor || !image || !cleanSrc || !cleanText) return false;
  SlateTransforms.setNodes(
    editor,
    {
      src: cleanSrc,
      caption: cleanText,
      alt: cleanCaption(alt || cleanText),
    },
    { at: DomEditor.findPath(editor, image) },
  );
  return true;
}
