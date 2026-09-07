import { Boot, DomEditor, SlateTransforms } from "@wangeditor/editor";
import { h } from "snabbdom";
import { TAXONOMY_RANK_MAP } from "../../shared/taxonomyRanks.js";

export const POST_CARD_TYPE = "life-post-card";
export const POST_CARD_CONTENT_EVENT = "life-post-card-content-change";
const REGISTRATION_FLAG = "__lifePostCardModuleRegistered";

function cleanText(value, maximum = 240) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeColor(value, fallback = "#eadf77") {
  return /^#[0-9a-f]{6}$/i.test(String(value || ""))
    ? value.toLowerCase()
    : fallback;
}

function contrastColor(color) {
  const value = Number.parseInt(String(color).slice(1), 16);
  const brightness =
    ((value >> 16) & 255) * 0.299 +
    ((value >> 8) & 255) * 0.587 +
    (value & 255) * 0.114;
  return brightness > 160 ? "#202122" : "#ffffff";
}

function tintColor(color, strength = 0.84) {
  const value = Number.parseInt(String(color).slice(1), 16);
  const channels = [value >> 16, (value >> 8) & 255, value & 255];
  return `#${channels
    .map((channel) =>
      Math.round(channel + (255 - channel) * strength)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function normalizeRows(rows, type) {
  return (Array.isArray(rows) ? rows : [])
    .slice(0, 60)
    .map((row) => {
      if (type !== "custom") {
        const rankKey = cleanText(row?.rankKey, 80);
        return {
          rankKey: TAXONOMY_RANK_MAP.has(rankKey) ? rankKey : "",
          value: cleanText(row?.value),
        };
      }
      return {
        label: cleanText(row?.label, 60),
        value: cleanText(row?.value),
      };
    })
    .filter((row) =>
      // Keep an empty taxonomy value while editing. A newly inserted card has
      // its rank rows before their values are entered, and dropping those rows
      // would leave no editable fields in the editor.
      type === "custom" ? row.label || row.value : row.rankKey,
    );
}

export function normalizePostCard(source = {}) {
  const type = source.type === "custom" ? "custom" : "taxonomy";
  return {
    id: /^[A-Za-z0-9_-]{1,80}$/.test(String(source.id || "")) ? source.id : "",
    type,
    title: cleanText(
      source.title || (type === "taxonomy" ? "科学分类" : "自定义卡片"),
      80,
    ),
    color: safeColor(source.color),
    imageSrc: String(
      source.imageSrc || source.imageUrl || source.imagePreview || "",
    ),
    imageCaption: cleanText(source.imageCaption, 120),
    rows: normalizeRows(source.rows, type),
  };
}

function decodeCard(element) {
  try {
    const source = JSON.parse(
      decodeURIComponent(element.getAttribute("data-life-card") || "{}"),
    );
    source.id = element.getAttribute("data-life-post-card");
    return normalizePostCard(source);
  } catch {
    return normalizePostCard({
      id: element.getAttribute("data-life-post-card"),
    });
  }
}

function syncCardModel(editor, element, card) {
  const next = normalizePostCard({ ...element, ...card });
  Object.assign(element, next);
  SlateTransforms.setNodes(editor, next, {
    at: DomEditor.findPath(editor, element),
  });
  window.dispatchEvent(
    new CustomEvent(POST_CARD_CONTENT_EVENT, {
      detail: { editor, card: next },
    }),
  );
}

function inputProps(editor, element, getValue, setValue, options = {}) {
  return {
    attrs: {
      type: "text",
      value: getValue(),
      maxlength: String(options.maximum || 240),
      placeholder: options.placeholder || "",
      "aria-label": options.label || "卡片字段",
      spellcheck: "false",
    },
    props: { value: getValue() },
    on: {
      input(event) {
        event.stopPropagation();
        setValue(event.target.value || "");
        syncCardModel(editor, element, {});
      },
      keydown(event) {
        event.stopPropagation();
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
        if (
          document.activeElement !== vnode.elm &&
          vnode.elm.value !== getValue()
        ) {
          vnode.elm.value = getValue();
        }
        return vnode;
      },
    },
  };
}

function renderPostCard(elemNode, _children, editor) {
  const card = normalizePostCard(elemNode);
  const selected = DomEditor.isNodeSelected(editor, elemNode);
  const isCustom = card.type === "custom";
  const rows = card.rows.length
    ? card.rows
    : [isCustom ? { label: "", value: "" } : { rankKey: "kingdom", value: "" }];
  const cells = [
    card.imageSrc
      ? h("tr", { class: { "pdf-card-image": true } }, [
          h("td", { attrs: { colspan: "2" } }, [
            h("img", {
              attrs: {
                src: card.imageSrc,
                alt: card.imageCaption || card.title,
              },
            }),
          ]),
        ])
      : null,
    ...rows.map((row, index) =>
      h("tr", [
        h(
          "th",
          isCustom
            ? {
                ...inputProps(
                  editor,
                  elemNode,
                  () => card.rows[index]?.label || "",
                  (value) => {
                    elemNode.rows = Array.isArray(elemNode.rows)
                      ? elemNode.rows
                      : [];
                    if (!elemNode.rows[index]) elemNode.rows[index] = { label: "", value: "" };
                    elemNode.rows[index].label = cleanText(value, 60);
                  },
                  { maximum: 60, label: "字段名称", placeholder: "字段名称" },
                ),
              }
            : null,
          isCustom
            ? []
            : [
                h("span", TAXONOMY_RANK_MAP.get(row.rankKey)?.zh || "字段"),
                TAXONOMY_RANK_MAP.get(row.rankKey)?.en
                  ? h("small", TAXONOMY_RANK_MAP.get(row.rankKey).en)
                  : null,
              ].filter(Boolean),
        ),
        h(
          "td",
          inputProps(
            editor,
            elemNode,
            () => card.rows[index]?.value || "",
            (value) => {
              elemNode.rows = Array.isArray(elemNode.rows)
                ? elemNode.rows
                : [];
              if (!elemNode.rows[index]) {
                elemNode.rows[index] = isCustom
                  ? { label: "", value: "" }
                  : { rankKey: row.rankKey || "kingdom", value: "" };
              }
              elemNode.rows[index].value = cleanText(value);
            },
            { label: isCustom ? "字段内容" : "分类内容", placeholder: "填写内容" },
          ),
        ),
      ]),
    ),
  ].filter(Boolean);

  return h(
    "figure",
    {
      attrs: {
        "data-w-e-type": POST_CARD_TYPE,
        "data-life-post-card": card.id,
        "data-life-card": encodeURIComponent(JSON.stringify(card)),
      },
      props: {
        contentEditable: false,
      },
      dataset: {
        selected: selected && !editor.isDisabled() ? "true" : "",
      },
      class: {
        "life-post-card": true,
        "classification-card-preview": true,
        "is-selected": selected && !editor.isDisabled(),
      },
      style: {
        "--classification-color": card.color,
        "--classification-tint": tintColor(card.color),
        "--classification-header-text": contrastColor(card.color),
      },
    },
    [
      h("a", {
        attrs: {
          href: `#post-card-${card.id}`,
          "aria-hidden": "true",
          tabindex: "-1",
        },
        class: { "life-post-card-anchor": true },
      }),
      h("table", { class: { "classification-card-preview": true } }, [
        h(
          "caption",
          inputProps(
            editor,
            elemNode,
            () => card.title,
            (value) => {
              elemNode.title = cleanText(value, 80);
            },
            { maximum: 80, label: "卡片标题", placeholder: "卡片标题" },
          ),
        ),
        h("tbody", cells),
      ]),
      card.imageSrc
        ? h(
          "figcaption",
          {
            class: { "life-card-caption": true, empty: !card.imageCaption },
            ...inputProps(
              editor,
              elemNode,
              () => card.imageCaption,
                (value) => {
                  elemNode.imageCaption = cleanText(value, 120);
                  elemNode.imageSrc = String(elemNode.imageSrc || "");
                },
              { maximum: 120, label: "图片说明", placeholder: "添加图片说明" },
            ),
          },
        )
        : null,
    ],
  );
}

export function postCardHtml(source) {
  const card = normalizePostCard(source);
  const config = encodeURIComponent(JSON.stringify(card));
  const rows = card.rows
    .map((row) => {
      const rank = TAXONOMY_RANK_MAP.get(row.rankKey);
      const label =
        card.type === "custom"
          ? `<span>${escapeHtml(row.label || "字段")}</span>`
          : `<span>${escapeHtml(rank?.zh || "字段")}</span>${rank?.en ? `<small>${escapeHtml(rank.en)}</small>` : ""}`;
      return `<tr><th>${label}</th><td>${escapeHtml(row.value || "—")}</td></tr>`;
    })
    .join("");
  const image = card.imageSrc
    ? `<tr class="pdf-card-image"><td colspan="2"><img src="${escapeHtml(card.imageSrc)}" alt="${escapeHtml(card.imageCaption || card.title)}"></td></tr>`
    : "";
  const caption = card.imageSrc
    ? `<figcaption>${escapeHtml(card.imageCaption)}</figcaption>`
    : "";
  return `<figure class="life-post-card classification-card-preview" data-life-post-card="${escapeHtml(card.id)}" data-life-card="${config}" style="--classification-color:${card.color};--classification-tint:${tintColor(card.color)};--classification-header-text:${contrastColor(card.color)}"><a href="#post-card-${escapeHtml(card.id)}" aria-hidden="true"></a><table class="classification-card-preview"><caption>${escapeHtml(card.title)}</caption><tbody>${image}${rows}</tbody></table>${caption}</figure>`;
}

function parsePostCard(element) {
  return {
    ...normalizePostCard(decodeCard(element)),
    // Slate void elements still require an empty text child for DOM mapping.
    children: [{ text: "" }],
  };
}

function withPostCard(editor) {
  const { isVoid, normalizeNode } = editor;
  editor.isVoid = (element) =>
    element.type === POST_CARD_TYPE ? true : isVoid(element);
  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (node?.type === POST_CARD_TYPE && DomEditor.isLastNode(editor, node)) {
      SlateTransforms.insertNodes(editor, DomEditor.genEmptyParagraph(), {
        at: [path[0] + 1],
      });
      return;
    }
    normalizeNode(entry);
  };
  return editor;
}

const postCardModule = {
  renderElems: [
    {
      type: POST_CARD_TYPE,
      renderElem: renderPostCard,
    },
  ],
  elemsToHtml: [
    {
      type: POST_CARD_TYPE,
      elemToHtml: postCardHtml,
    },
  ],
  parseElemsHtml: [
    {
      selector: "figure[data-life-post-card]",
      parseElemHtml: parsePostCard,
    },
  ],
  editorPlugin: withPostCard,
};

export function registerPostCardModule() {
  if (globalThis[REGISTRATION_FLAG]) return;
  Boot.registerModule(postCardModule);
  globalThis[REGISTRATION_FLAG] = true;
}

function walkNodes(nodes, callback) {
  for (const node of nodes || []) {
    if (node.type === POST_CARD_TYPE) callback(node);
    if (Array.isArray(node.children)) walkNodes(node.children, callback);
  }
}

export function getPostCardNodes(editor) {
  const result = [];
  if (editor) walkNodes(editor.children, (node) => result.push(node));
  return result;
}

export function getPostCardIdsInHtml(html = "") {
  if (typeof DOMParser === "undefined") {
    return new Set(
      [
        ...String(html || "").matchAll(
          /data-life-post-card=["']([A-Za-z0-9_-]{1,80})["']/g,
        ),
      ].map((match) => match[1]),
    );
  }
  const body = new DOMParser().parseFromString(
    `<body>${html || ""}</body>`,
    "text/html",
  ).body;
  return new Set(
    [...body.querySelectorAll("[data-life-post-card]")]
      .map((node) => node.getAttribute("data-life-post-card"))
      .filter(Boolean),
  );
}

export function migrateLegacyPostCardMarkers(html, cards = []) {
  const source = String(html || "");
  if (typeof DOMParser === "undefined" || !source.includes("#post-card-"))
    return source;
  const documentNode = new DOMParser().parseFromString(
    `<body>${source}</body>`,
    "text/html",
  );
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  for (const anchor of [
    ...documentNode.body.querySelectorAll('a[href^="#post-card-"]'),
  ]) {
    const id = anchor
      .getAttribute("href")
      ?.match(/^#post-card-([A-Za-z0-9_-]{1,80})$/)?.[1];
    const card = cardMap.get(id);
    if (!card) continue;
    const holder = documentNode.createElement("template");
    holder.innerHTML = postCardHtml(card);
    const node = holder.content.firstElementChild;
    const parent = anchor.parentElement;
    if (node && parent) parent.replaceWith(node);
  }
  return documentNode.body.innerHTML;
}

export function insertPostCardBlock(editor, source) {
  const card = normalizePostCard(source);
  if (!editor || !card.id) return false;
  const nodes = [
    {
      type: POST_CARD_TYPE,
      children: [{ text: "" }],
      ...card,
    },
    DomEditor.genEmptyParagraph(),
  ];
  // Try to focus and restore selection first
  if (editor.selection === null && typeof editor.focus === "function") {
    editor.focus();
  }
  if (editor.selection === null) editor.restoreSelection();
  // If we have a selection, insert at cursor
  if (editor.selection !== null) {
    SlateTransforms.insertNodes(editor, nodes, { select: true });
    return true;
  }
  // No selection: insert at end of document using explicit path
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

export function updatePostCardBlock(editor, source) {
  const card = normalizePostCard(source);
  const node = getPostCardNodes(editor).find((item) => item.id === card.id);
  if (!editor || !node) return false;
  SlateTransforms.setNodes(editor, card, {
    at: DomEditor.findPath(editor, node),
  });
  return true;
}
