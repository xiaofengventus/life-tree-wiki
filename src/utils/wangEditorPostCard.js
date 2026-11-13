import {
  Boot,
  DomEditor,
  SlateEditor,
  SlateTransforms,
} from "@wangeditor/editor";
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

/**
 * 行的形状统一为 `{ rankKey, label, value }`：
 * - 正常走分类阶元：`rankKey` 有值，字段名由 TAXONOMY_RANK_MAP 决定；
 * - `label` 只为兼容早期「自定义卡片」留下来的旧数据（那种卡片已不再提供创建入口），
 *   旧行还能照原样显示，但不能再用来新建字段。
 */
function normalizeRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .slice(0, 60)
    .map((row) => ({
      rankKey: TAXONOMY_RANK_MAP.has(cleanText(row?.rankKey, 80))
        ? cleanText(row?.rankKey, 80)
        : "",
      label: cleanText(row?.label, 60),
      value: cleanText(row?.value),
    }))
    .filter((row) =>
      // 保留没填值的分类行：刚插入的卡片就是这样，全删掉就一个可填的字段都不剩。
      row.rankKey || row.label,
    );
}

export function normalizePostCard(source = {}) {
  return {
    id: /^[A-Za-z0-9_-]{1,80}$/.test(String(source.id || "")) ? source.id : "",
    // ⚠️ 数据里刻意不再有 `type` 字段：卡片节点本身用 `type` 标记元素类型
    // （POST_CARD_TYPE = "life-post-card"），一旦数据里也有 `type`，`{...card}` 展开时
    // 会把节点的 type 覆盖成 "taxonomy" → 渲染器匹配不上，插进去的是一个看不见的空节点。
    title: cleanText(source.title || "科学分类", 80),
    color: safeColor(source.color),
    imageSrc: String(
      source.imageSrc || source.imageUrl || source.imagePreview || "",
    ),
    imageCaption: cleanText(source.imageCaption, 120),
    rows: normalizeRows(source.rows),
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

function renderPostCard(elemNode, children, editor) {
  const card = normalizePostCard(elemNode);
  const selected = DomEditor.isNodeSelected(editor, elemNode);
  const rows = card.rows.length
    ? card.rows
    : [{ rankKey: "kingdom", label: "", value: "" }];
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
          row.rankKey
            ? null
            : // 没有阶元就是早期「自定义卡片」留下来的旧行，字段名原样显示
              {},
          row.rankKey
            ? [
                h("span", TAXONOMY_RANK_MAP.get(row.rankKey)?.zh || "字段"),
                TAXONOMY_RANK_MAP.get(row.rankKey)?.en
                  ? h("small", TAXONOMY_RANK_MAP.get(row.rankKey).en)
                  : null,
              ].filter(Boolean)
            : [h("span", row.label || "字段")],
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
                elemNode.rows[index] = {
                  rankKey: row.rankKey || "kingdom",
                  label: row.label || "",
                  value: "",
                };
              }
              elemNode.rows[index].value = cleanText(value);
            },
            { label: "分类内容", placeholder: "填写内容" },
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
    // ⚠️ 即便这是 void 节点，也必须把 children 渲染进去：Slate 靠它做 DOM ↔ 节点的映射，
    // 漏掉就会在插入时抛 "Unable to find the path for Slate node"，卡片永远渲染不出来。
    [
      ...(Array.isArray(children) ? children : children ? [children] : []),
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
      const label = rank
        ? `<span>${escapeHtml(rank.zh || "字段")}</span>${rank.en ? `<small>${escapeHtml(rank.en)}</small>` : ""}`
        : `<span>${escapeHtml(row.label || "字段")}</span>`;
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

function walkNodes(nodes, callback, path = []) {
  (nodes || []).forEach((node, index) => {
    const at = [...path, index];
    if (node.type === POST_CARD_TYPE) callback(node, at);
    if (Array.isArray(node.children)) walkNodes(node.children, callback, at);
  });
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
  // ⚠️ `type` 必须写在展开之后：卡片数据早先带 `type: "taxonomy"`，放在最后会覆盖掉
  // 节点自己的 type，导致渲染器匹配不上，插出来的是一个看不见的空节点。
  const cardNode = { ...card, type: POST_CARD_TYPE, children: [{ text: "" }] };
  const nodes = [cardNode, DomEditor.genEmptyParagraph()];
  // Try to focus and restore selection first
  if (editor.selection === null && typeof editor.focus === "function") {
    editor.focus();
  }
  if (editor.selection === null) editor.restoreSelection();
  // If we have a selection, insert at cursor
  if (editor.selection !== null) {
    // 不带 select：select 会让 Slate 立刻为新节点解析路径，而此时 DOM ↔ 节点映射还没建立，
    // 会抛 "Unable to find the path for Slate node"。插完再把光标放到后面的空段落即可。
    SlateTransforms.insertNodes(editor, nodes);
    SlateTransforms.select(editor, SlateEditor.end(editor, []));
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
  if (!editor || !card.id) return false;
  // ⚠️ 这里不能用 DomEditor.findPath：本函数常被 Vue 的 deep watcher 同步调用，
  // 那时刚插入的节点还没进 Slate 的 DOM ↔ 节点映射表（要等下一次渲染），
  // findPath 会抛 "Unable to find the path for Slate node"，连锁把渲染打崩。
  // 遍历时把路径一起带出来即可。
  let target = null;
  walkNodes(editor.children, (node, at) => {
    if (node.id === card.id) target = at;
  });
  if (!target) return false;
  SlateTransforms.setNodes(editor, { ...card, type: POST_CARD_TYPE }, {
    at: target,
  });
  return true;
}
