<script setup>
/**
 * ComponentRenderer —— 单个组件的渲染器（30 种组件，v-if 分发）
 * ------------------------------------------------------------------
 * 关键原则：
 *   「所有视觉样式 → 都通过 rs(comp) 生成 inline style」
 *   （除了结构必须的 scoped CSS，例如 code pre 的 white-space、table 的 border-collapse）
 *
 * 组件分 6 大类：
 *   ① 基础组件：text / heading / image / divider / spacer
 *   ② 内容组件：paragraph / quote / list / table / code / link
 *   ③ 文章组件：articleTitle / subtitle / author / date / toc / footnote / pageNumber
 *   ④ 信息组件：callout / warning / tip / info / notice
 *   ⑤ 布局组件：container / columns / sidebar / card / grid
 *   ⑥ 图片组件：picture
 *
 * 所见即所得编辑（editable=true 时）：
 *   文字元素直接挂 contenteditable，用户在画布里点击即可输入。
 *   通过自定义指令 v-edit 实现：
 *     - mounted 时把 content 写入 DOM（非编辑模式和编辑模式视觉完全一致）
 *     - input 时把 innerHTML / textContent 通过 content-patch 事件回写文档
 *     - 元素聚焦期间跳过外部同步，避免 Vue 重渲染打断光标
 */
import { nextTick, computed } from "vue";
import { styleToInlineObject } from "@/utils/ui-pdf/styleGenerator.js";
import { resolveComponentStyle } from "@/utils/ui-pdf/themes.js";

const props = defineProps({
  component: { type: Object, required: true },
  theme: { type: Object, required: true },
  interactive: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  // 布局组件中的子组件（columns/cells）可以从父组件传 doc 来查嵌套 childIds
  doc: { type: Object, default: null },
});
const emit = defineEmits(["block-click", "content-patch"]);

const c = computed(() => props.component);
function rs(comp) {
  return styleToInlineObject(
    resolveComponentStyle(props.theme, comp || props.component),
  );
}

function onWrapClick(event) {
  if (!props.interactive) return;
  event.stopPropagation();
  emit("block-click", props.component.id);
}

function patchContent(id, patch) {
  emit("content-patch", { id, patch });
}

/* =========================================================
 * v-edit 指令：画布内直接编辑（所见即所得）
 * ---------------------------------------------------------
 * binding.value 结构：
 *   {
 *     enabled:     Boolean,        // 是否开启 contenteditable（预览/打印时 false，仅同步内容）
 *     id:          String,         // 组件 id（回写定位）
 *     key:         String,         // content 字段名（text/html/source/caption/title/...）
 *     kind:        "text" | "html" | "list-item" | "table-cell",
 *     mode:        "normal" | "code",
 *     index:       Number,         // list-item / table-cell 用
 *     rowIndex:    Number,         // table-cell 用
 *     colIndex:    Number,         // table-cell 用
 *     value:       Any,            // 初始内容
 *     singleLine:  Boolean,        // 回车 = 失焦（标题类）
 *     placeholder: String,         // 为空时的占位提示
 *     dataKey:     String|null,    // data-edit-key，用于编辑后重新聚焦（列表新增行）
 *   }
 * =======================================================*/
function placeCaret(el, atStart = false) {
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(atStart);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    /* ignore */
  }
}
function focusEditable(key) {
  if (!key) return;
  nextTick(() => {
    const el = document.querySelector(`[data-edit-key="${key}"]`);
    if (el) {
      el.focus();
      placeCaret(el, true);
    }
  });
}

const vEdit = {
  mounted(el, binding) {
    const o = binding.value || {};
    el.__editOpts = o;
    // 初始内容同步（编辑/预览两种模式都执行，保证视觉一致）
    if (o.kind === "html") el.innerHTML = o.value ?? "";
    else if (o.mode === "code") el.innerText = o.value ?? "";
    else el.textContent = String(o.value ?? "");
    if (o.placeholder) el.dataset.ph = o.placeholder;
    if (o.dataKey) el.dataset.editKey = o.dataKey;
    if (!o.enabled) return;

    el.classList.add("sr-editable");
    if (o.kind === "html") el.classList.add("sr-editable-rich");
    if (o.mode === "code") el.setAttribute("contenteditable", "plaintext-only");
    else el.setAttribute("contenteditable", "true");
    el.spellcheck = false;

    el.__onFocus = () => {
      // 回车段落分隔符用 <p>，与 paragraph 的样式约定一致
      try {
        document.execCommand("defaultParagraphSeparator", false, "p");
      } catch {
        /* ignore */
      }
      emit("block-click", o.id);
    };
    el.__onInput = () => {
      const cur = el.__editOpts || {};
      if (cur.kind === "html") {
        patchContent(cur.id, { [cur.key]: el.innerHTML });
      } else if (cur.kind === "list-item") {
        const items = [...(props.component.content?.items || [])];
        items[cur.index] = el.textContent.replace(/\n/g, "");
        patchContent(cur.id, { items });
      } else if (cur.kind === "table-cell") {
        const rows = (props.component.content?.rows || []).map((r) => [...r]);
        if (rows[cur.rowIndex])
          rows[cur.rowIndex][cur.colIndex] = el.textContent.replace(/\n/g, "");
        patchContent(cur.id, { rows });
      } else if (cur.mode === "code") {
        patchContent(cur.id, { [cur.key]: el.innerText });
      } else {
        patchContent(cur.id, { [cur.key]: el.textContent });
      }
    };
    el.__onKey = (e) => {
      const cur = el.__editOpts || {};
      if (e.key === "Enter") {
        if (cur.mode === "code") return; // 代码块允许换行（plaintext-only 自动插 \n）
        if (cur.kind === "list-item") {
          // 回车 = 新增一条列表项
          e.preventDefault();
          const items = [...(props.component.content?.items || [])];
          items.splice(cur.index + 1, 0, "");
          patchContent(cur.id, { items });
          focusEditable(`${cur.id}:li:${cur.index + 1}`);
          return;
        }
        if (cur.singleLine) {
          // 标题类单行字段：回车 = 确认并退出编辑
          e.preventDefault();
          el.blur();
          return;
        }
        // 富文本字段：浏览器默认把当前 <p> 拆成两段
        return;
      }
      if (e.key === "Backspace" && cur.kind === "list-item") {
        const items = props.component.content?.items || [];
        if (items.length > 1 && el.textContent.trim() === "") {
          // 空列表项按 Backspace = 删除该行
          e.preventDefault();
          items.splice(cur.index, 1);
          patchContent(cur.id, { items });
          focusEditable(`${cur.id}:li:${Math.max(0, cur.index - 1)}`);
        }
      }
    };
    el.addEventListener("focus", el.__onFocus);
    el.addEventListener("input", el.__onInput);
    el.addEventListener("keydown", el.__onKey);
  },
  updated(el, binding) {
    const o = binding.value || {};
    el.__editOpts = o;
    if (o.dataKey) el.dataset.editKey = o.dataKey;
    else el.removeAttribute("data-edit-key");
    // 编辑中（有焦点）绝不回写，否则光标会跳
    if (document.activeElement === el) return;
    const isHtml = o.kind === "html";
    const isCode = o.mode === "code";
    const curVal = isHtml
      ? el.innerHTML
      : isCode
        ? el.innerText
        : el.textContent;
    const wantVal = isHtml ? String(o.value ?? "") : String(o.value ?? "");
    if (curVal !== wantVal) {
      if (isHtml) el.innerHTML = wantVal;
      else if (isCode) el.innerText = wantVal;
      else el.textContent = wantVal;
    }
  },
  unmounted(el) {
    if (el.__onFocus) el.removeEventListener("focus", el.__onFocus);
    if (el.__onInput) el.removeEventListener("input", el.__onInput);
    if (el.__onKey) el.removeEventListener("keydown", el.__onKey);
  },
};

// ---- TOC：根据 v2 doc 中所有 heading 组件生成树 ----
function tocItems() {
  if (!props.doc) return [];
  const maxLevels = props.component.content?.levels || [2, 3];
  const out = [];
  for (const page of props.doc.pages || []) {
    const ids = page.regions?.main || [];
    for (const id of ids) {
      const comp = props.doc.components?.[id];
      if (
        comp &&
        comp.type === "heading" &&
        maxLevels.includes(comp.level || 2)
      ) {
        out.push({
          text: comp.content?.text || "",
          level: comp.level || 2,
          anchor: comp.id,
        });
      }
    }
  }
  return out;
}
</script>

<template>
  <div
    class="sr-comp"
    :class="{ 'sr-comp-selected': interactive && selected }"
    @click="onWrapClick"
  >
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- ① 基础组件 -->
    <!-- ═══════════════════════════════════════════════════════════════ -->

    <!-- Text -->
    <span
      v-if="c.type === 'text'"
      v-edit="{
        enabled: editable,
        id: c.id,
        key: 'text',
        value: c.content?.text,
        singleLine: true,
        placeholder: '输入文字',
      }"
      :style="rs()"
    ></span>

    <!-- Heading（根据 level 决定标签 H1~H6） -->
    <component
      v-else-if="c.type === 'heading'"
      :is="`h${Math.min(6, Math.max(1, c.level || 2))}`"
      v-edit="{
        enabled: editable,
        id: c.id,
        key: 'text',
        value: c.content?.text,
        singleLine: true,
        placeholder: '标题文字',
      }"
      :style="rs()"
    ></component>

    <!-- Image（旧版，基础组件） -->
    <figure v-else-if="c.type === 'image'" :style="rs()">
      <img
        v-if="c.content?.src"
        :src="c.content.src"
        :alt="c.content.alt || ''"
        :style="{
          width: '100%',
          height: 'auto',
          objectFit: c.content.objectFit || 'contain',
          display: 'block',
        }"
      />
      <div v-else class="sr-image-placeholder">图片占位</div>
      <figcaption
        v-if="editable || c.content?.caption"
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'caption',
          value: c.content?.caption || '',
          singleLine: true,
          placeholder: '图注（点击编辑）',
        }"
        class="sr-figcaption"
      ></figcaption>
      <small
        v-if="editable || c.content?.credit"
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'credit',
          value: c.content?.credit || '',
          singleLine: true,
          placeholder: '版权信息',
        }"
        class="sr-figcredit"
      ></small>
    </figure>

    <!-- Divider -->
    <hr v-else-if="c.type === 'divider'" :style="rs()" />

    <!-- Spacer -->
    <div
      v-else-if="c.type === 'spacer'"
      :style="{
        height: `${Number(c.content?.height || 18)}px`,
        ...rs(),
      }"
    ></div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- ② 内容组件 -->
    <!-- ═══════════════════════════════════════════════════════════════ -->

    <!-- Paragraph（富文本：画布内直接编辑，回车分段） -->
    <div
      v-else-if="c.type === 'paragraph'"
      class="sr-paragraph"
      v-edit="{
        enabled: editable,
        id: c.id,
        key: 'html',
        kind: 'html',
        value: c.content?.html || '',
        placeholder: '输入正文…',
      }"
      :style="rs()"
    ></div>

    <!-- Quote -->
    <blockquote v-else-if="c.type === 'quote'" :style="rs()">
      <div
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'html',
          kind: 'html',
          value: c.content?.html || '',
          placeholder: '引用文字…',
        }"
      ></div>
      <small v-if="editable || c.content?.cite" class="sr-quote-cite"
        ><template v-if="c.content?.cite">—— </template
        ><span
          v-edit="{
            enabled: editable,
            id: c.id,
            key: 'cite',
            value: c.content?.cite || '',
            singleLine: true,
            placeholder: '来源',
          }"
        ></span
      ></small>
    </blockquote>

    <!-- List（真实元素渲染；编辑态：回车新增项、空项 Backspace 删除） -->
    <div v-else-if="c.type === 'list'" class="sr-list" :style="rs()">
      <component :is="c.content?.ordered ? 'ol' : 'ul'">
        <li
          v-for="(item, i) in c.content?.items || []"
          :key="`li-${i}`"
          v-edit="{
            enabled: editable,
            id: c.id,
            kind: 'list-item',
            index: i,
            value: item,
            dataKey: editable ? `${c.id}:li:${i}` : null,
            placeholder: '列表项',
          }"
        ></li>
      </component>
    </div>

    <!-- Table（编辑态：每个单元格直接输入，回车确认） -->
    <table v-else-if="c.type === 'table'" class="sr-table" :style="rs()">
      <thead v-if="c.content?.headerRow">
        <tr>
          <th
            v-for="(cell, ci) in c.content.rows?.[0] || []"
            :key="`th-${ci}`"
            class="sr-table-th"
            v-edit="{
              enabled: editable,
              id: c.id,
              kind: 'table-cell',
              rowIndex: 0,
              colIndex: ci,
              value: cell,
              singleLine: true,
            }"
            :style="
              rs({
                ...c,
                ...(c.style || {}),
                typography: { ...(c.style?.typography || {}), fontWeight: 750 },
                color: {
                  ...(c.style?.color || {}),
                  backgroundColor: '#F3F7F3',
                },
              })
            "
          ></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, ri) in c.content?.headerRow
            ? (c.content.rows || []).slice(1)
            : c.content.rows || []"
          :key="`tr-${ri}`"
        >
          <td
            v-for="(cell, ci) in row"
            :key="`td-${ri}-${ci}`"
            class="sr-table-td"
            v-edit="{
              enabled: editable,
              id: c.id,
              kind: 'table-cell',
              rowIndex: c.content.headerRow ? ri + 1 : ri,
              colIndex: ci,
              value: cell,
              singleLine: true,
            }"
            :style="rs()"
          ></td>
        </tr>
      </tbody>
    </table>

    <!-- Code（plaintext-only：保留换行与缩进） -->
    <pre v-else-if="c.type === 'code'" class="sr-code" :style="rs()"><code
      v-edit="{ enabled: editable, id: c.id, key: 'source', mode: 'code', value: c.content?.source || '', placeholder: '// 输入代码' }"
    ></code></pre>

    <!-- Link（编辑态不带 href，避免点击跳转） -->
    <a
      v-else-if="c.type === 'link'"
      :href="editable ? undefined : c.content?.href || '#'"
      :target="
        !editable && c.content?.href?.startsWith('http') ? '_blank' : undefined
      "
      :rel="
        !editable && c.content?.href?.startsWith('http')
          ? 'noopener'
          : undefined
      "
      :style="rs()"
      ><span
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'text',
          value: c.content?.text || c.content?.href || '',
          singleLine: true,
          placeholder: '链接文字',
        }"
      ></span
    ></a>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- ③ 文章组件 -->
    <!-- ═══════════════════════════════════════════════════════════════ -->

    <!-- ArticleTitle -->
    <h1
      v-else-if="c.type === 'articleTitle'"
      v-edit="{
        enabled: editable,
        id: c.id,
        key: 'text',
        value: c.content?.text,
        singleLine: true,
        placeholder: '文档大标题',
      }"
      :style="rs()"
    ></h1>
    <!-- Subtitle -->
    <p
      v-else-if="c.type === 'subtitle'"
      v-edit="{
        enabled: editable,
        id: c.id,
        key: 'text',
        value: c.content?.text,
        singleLine: true,
        placeholder: '副标题',
      }"
      :style="rs()"
    ></p>
    <!-- Author -->
    <p
      v-else-if="c.type === 'author'"
      v-edit="{
        enabled: editable,
        id: c.id,
        key: 'text',
        value: c.content?.text,
        singleLine: true,
        placeholder: '作者',
      }"
      :style="rs()"
    ></p>
    <!-- Date -->
    <p
      v-else-if="c.type === 'date'"
      v-edit="{
        enabled: editable,
        id: c.id,
        key: 'text',
        value: c.content?.text,
        singleLine: true,
        placeholder: '日期',
      }"
      :style="rs()"
    ></p>

    <!-- TOC（自动生成，不直接编辑） -->
    <nav v-else-if="c.type === 'toc'" class="sr-toc" :style="rs()">
      <ul
        class="sr-toc-list"
        :style="{ listStyle: 'none', margin: 0, padding: 0 }"
      >
        <li
          v-for="(item, i) in tocItems()"
          :key="`toc-${i}`"
          class="sr-toc-item"
          :style="{
            paddingLeft: `${(item.level - 1) * 14}px`,
            marginBottom: '4px',
            lineHeight: '1.55',
            fontSize: `${Math.max(9, 12 - (item.level - 2))}pt`,
            color: 'inherit',
          }"
        >
          <span class="sr-toc-text">{{ item.text }}</span>
        </li>
      </ul>
    </nav>

    <!-- Footnote -->
    <p v-else-if="c.type === 'footnote'" class="sr-footnote" :style="rs()">
      <sup>{{ c.content?.id || "" }}</sup>
      <span
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'text',
          value: c.content?.text || '',
          singleLine: true,
          placeholder: '脚注内容',
        }"
      ></span>
    </p>

    <!-- PageNumber -->
    <span
      v-else-if="c.type === 'pageNumber'"
      v-edit="{
        enabled: editable,
        id: c.id,
        key: 'pattern',
        value: c.content?.pattern || '{page} / {total}',
        singleLine: true,
        placeholder: '{page} / {total}',
      }"
      :style="rs()"
    ></span>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- ④ 信息组件：Callout / Warning / Tip / Info / Notice -->
    <!-- （结构完全一致，默认 style 在 themes.js 的 presetStyle 里区分颜色） -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div
      v-else-if="
        ['callout', 'warning', 'tip', 'info', 'notice'].includes(c.type)
      "
      class="sr-infobox"
      :style="rs()"
    >
      <div
        class="sr-infobox-title"
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'title',
          value: c.content?.title || '',
          singleLine: true,
          placeholder: '提示标题',
        }"
        :style="{ fontWeight: 750, marginBottom: '6px', fontSize: '10.5pt' }"
      ></div>
      <div
        class="sr-infobox-body"
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'body',
          kind: 'html',
          value: c.content?.body || '',
          placeholder: '提示内容…',
        }"
      ></div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- ⑤ 布局组件：Container / Columns / Sidebar / Card / Grid -->
    <!-- ═══════════════════════════════════════════════════════════════ -->

    <!-- Container：children 是组件 ID 数组，需通过 props.doc 查询嵌套 -->
    <div v-else-if="c.type === 'container'" class="sr-container" :style="rs()">
      <template v-if="doc">
        <ComponentRenderer
          v-for="childId in c.content?.childIds || []"
          :key="childId"
          :component="doc.components[childId]"
          v-if="doc.components?.[childId]"
          :theme="theme"
          :interactive="interactive"
          :editable="editable"
          :selected="selected"
          :doc="doc"
          @block-click="(id) => emit('block-click', id)"
          @content-patch="(e) => emit('content-patch', e)"
        />
      </template>
    </div>

    <!-- Columns：多栏 -->
    <div
      v-else-if="c.type === 'columns'"
      class="sr-columns"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${c.content?.columns || 2}, minmax(0,1fr))`,
        gap: '14px',
        ...rs(),
      }"
    >
      <div
        v-for="(col, ci) in c.content?.childIds || []"
        :key="`col-${ci}`"
        class="sr-col"
        :style="{ minWidth: 0 }"
      >
        <template v-if="doc && Array.isArray(col)">
          <ComponentRenderer
            v-for="childId in col"
            :key="childId"
            :component="doc.components?.[childId]"
            v-if="doc.components?.[childId]"
            :theme="theme"
            :interactive="interactive"
            :editable="editable"
            :selected="false"
            :doc="doc"
            @block-click="(id) => emit('block-click', id)"
            @content-patch="(e) => emit('content-patch', e)"
          />
        </template>
      </div>
    </div>

    <!-- Sidebar：左/右 + 主区 -->
    <div
      v-else-if="c.type === 'sidebar'"
      class="sr-sbwrapper"
      :style="{
        display: 'grid',
        gridTemplateColumns:
          c.content?.side === 'right' ? '1fr 38mm' : '38mm 1fr',
        gap: '7mm',
        ...rs(),
      }"
    >
      <div class="sr-sb-side" v-if="doc && c.content?.side !== 'right'">
        <ComponentRenderer
          v-for="childId in c.content?.childIds?.sidebar || []"
          :key="childId"
          :component="doc.components?.[childId]"
          v-if="doc.components?.[childId]"
          :theme="theme"
          :interactive="interactive"
          :editable="editable"
          :selected="false"
          :doc="doc"
          @block-click="(id) => emit('block-click', id)"
          @content-patch="(e) => emit('content-patch', e)"
        />
      </div>
      <div class="sr-sb-main">
        <ComponentRenderer
          v-for="childId in c.content?.childIds?.main || []"
          :key="childId"
          :component="doc.components?.[childId]"
          v-if="doc && doc.components?.[childId]"
          :theme="theme"
          :interactive="interactive"
          :editable="editable"
          :selected="false"
          :doc="doc"
          @block-click="(id) => emit('block-click', id)"
          @content-patch="(e) => emit('content-patch', e)"
        />
      </div>
      <div class="sr-sb-side" v-if="doc && c.content?.side === 'right'">
        <ComponentRenderer
          v-for="childId in c.content?.childIds?.sidebar || []"
          :key="childId"
          :component="doc.components?.[childId]"
          v-if="doc.components?.[childId]"
          :theme="theme"
          :interactive="interactive"
          :editable="editable"
          :selected="false"
          :doc="doc"
          @block-click="(id) => emit('block-click', id)"
          @content-patch="(e) => emit('content-patch', e)"
        />
      </div>
    </div>

    <!-- Card：卡片 -->
    <div v-else-if="c.type === 'card'" class="sr-card" :style="rs()">
      <div
        class="sr-card-title"
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'title',
          value: c.content?.title || '',
          singleLine: true,
          placeholder: '卡片标题',
        }"
        :style="{ fontWeight: 800, marginBottom: '8px', fontSize: '11pt' }"
      ></div>
      <div
        class="sr-card-body"
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'bodyHtml',
          kind: 'html',
          value: c.content?.bodyHtml || '',
          placeholder: '卡片内容…',
        }"
      ></div>
    </div>

    <!-- Grid：NxM 栅格 -->
    <div
      v-else-if="c.type === 'grid'"
      class="sr-grid"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${c.content?.columns || 3}, minmax(0,1fr))`,
        gridAutoRows: '1fr',
        gap: '10px',
        ...rs(),
      }"
    >
      <template
        v-for="(cell, ci) in c.content?.cells || []"
        :key="`cell-${ci}`"
      >
        <div
          v-if="cell.kind === 'image'"
          class="sr-gridcell"
          :style="{
            minHeight: '80px',
            border: '1px solid var(--sr-rule,#d8dfd8)',
            borderRadius: '4px',
            overflow: 'hidden',
            background: '#fff',
          }"
        >
          <img
            v-if="cell.src"
            :src="cell.src"
            :alt="cell.alt || ''"
            :style="{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }"
          />
          <div
            v-if="cell.caption"
            class="sr-gridcell-cap"
            :style="{
              padding: '4px',
              color: 'var(--sr-muted,#6b7c74)',
              fontSize: '7.4pt',
              textAlign: 'center',
            }"
          >
            {{ cell.caption }}
          </div>
        </div>
        <div
          v-else-if="
            doc && cell.componentId && doc.components?.[cell.componentId]
          "
          class="sr-gridcell sr-gridcell-comp"
        >
          <ComponentRenderer
            :component="doc.components[cell.componentId]"
            :theme="theme"
            :interactive="interactive"
            :editable="editable"
            :selected="false"
            :doc="doc"
            @block-click="(id) => emit('block-click', id)"
            @content-patch="(e) => emit('content-patch', e)"
          />
        </div>
      </template>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- ⑥ 图片增强组件：Picture -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <figure v-else-if="c.type === 'picture'" class="sr-picture" :style="rs()">
      <div
        class="sr-picture-imgwrap"
        :style="{
          width: c.content?.width || '100%',
          height:
            c.content?.height === 'auto' ? 'auto' : c.content?.height || 'auto',
          marginLeft:
            c.content?.align === 'center'
              ? 'auto'
              : c.content?.align === 'right'
                ? 'auto'
                : 0,
          marginRight:
            c.content?.align === 'center'
              ? 'auto'
              : c.content?.align === 'left'
                ? 'auto'
                : 0,
          display: c.content?.align === 'center' ? 'block' : undefined,
          border: c.content?.border?.enabled
            ? `${c.content.border.width || 1}px ${c.content.border.color || '#d8dfd8'} solid`
            : 'none',
          borderRadius: `${Number(c.content?.borderRadius ?? 4)}px`,
          boxShadow:
            !c.content?.shadow || c.content.shadow === 'none'
              ? 'none'
              : c.content.shadow === 'small'
                ? '0 1px 2px rgba(0,0,0,.08)'
                : c.content.shadow === 'large'
                  ? '0 12px 24px rgba(0,0,0,.15)'
                  : '0 2px 8px rgba(0,0,0,.10)',
          overflow: 'hidden',
        }"
      >
        <img
          v-if="c.content?.src"
          :src="c.content.src"
          :alt="c.content.alt || ''"
          :style="{
            width: '100%',
            height: c.content?.height === 'auto' ? 'auto' : '100%',
            objectFit: c.content?.objectFit || 'contain',
            display: 'block',
          }"
        />
        <div v-else class="sr-image-placeholder">图片占位 · Picture 组件</div>
      </div>
      <figcaption
        v-if="editable || c.content?.caption"
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'caption',
          value: c.content?.caption || '',
          singleLine: true,
          placeholder: '图注（点击编辑）',
        }"
        class="sr-figcaption"
      ></figcaption>
      <small
        v-if="editable || c.content?.credit"
        v-edit="{
          enabled: editable,
          id: c.id,
          key: 'credit',
          value: c.content?.credit || '',
          singleLine: true,
          placeholder: '版权信息',
        }"
        class="sr-figcredit"
      ></small>
    </figure>

    <!-- 兜底（未知组件类型） -->
    <div v-else class="sr-unknown" :style="rs()">
      <span style="color: var(--sr-muted, #6b7c74); font-size: 9pt">
        未知组件：<code>{{ c.type }}</code>
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 纯结构样式；视觉样式完全由 inline style 决定 */
.sr-paragraph :deep(p) {
  margin: 0;
}
.sr-paragraph :deep(p + p) {
  margin-top: 0.5em;
}
.sr-paragraph :deep(ul),
.sr-paragraph :deep(ol) {
  padding-left: 1.4em;
  margin: 0 0 0.8em;
}
.sr-paragraph :deep(blockquote) {
  margin: 0;
  padding: 0.2em 0 0.2em 1em;
  border-left: 2px solid var(--sr-primary, #33691e);
  color: var(--sr-muted, #5d6d64);
}
.sr-paragraph :deep(a) {
  color: var(--sr-primary, #33691e);
}
.sr-paragraph :deep(img) {
  max-width: 100%;
  height: auto;
}
.sr-list :deep(ul),
.sr-list :deep(ol) {
  margin: 0;
  padding-left: 1.4em;
}
.sr-list :deep(li) {
  margin-bottom: 4px;
  overflow-wrap: anywhere;
}

.sr-table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
}
.sr-table-th,
.sr-table-td {
  overflow-wrap: anywhere;
  vertical-align: top;
}

.sr-code {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.sr-code code {
  display: block;
}

.sr-quote-cite {
  display: block;
  margin-top: 6px;
  color: var(--sr-muted, #5d6d64);
  font-size: 8.5pt;
}
.sr-figcaption {
  margin-top: 4px;
  color: var(--sr-muted, #6b7c74);
  font-size: 8pt;
  line-height: 1.4;
}
.sr-figcredit {
  display: block;
  margin-top: 2px;
  color: #97a59c;
  font-size: 7pt;
}
.sr-image-placeholder {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f7f3;
  color: #9caa9f;
  font-size: 9.5pt;
  border: 1px dashed #cdd6cf;
  border-radius: 4px;
}
.sr-infobox-body :deep(p) {
  margin: 0 0 6px;
}
.sr-infobox-body :deep(p:last-child) {
  margin-bottom: 0;
}
.sr-footnote {
  margin: 0;
}
</style>
