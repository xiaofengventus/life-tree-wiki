<!--
  ============================================================================
  原方案 (Original Implementation) - 保留此文件作为回退参考
  ============================================================================
  
  此组件使用 simple-mind-map 库渲染进化树，节点内容为 SVG 元素。
  如需切换到真实 HTML DOM 渲染方案，请使用 HtmlTreeRenderer.vue
  
  相关文件：
  - evolution_mind_map.vue (本文件) - 原方案，基于 simple-mind-map SVG 渲染
  - EvolutionTreeViewer.vue - 原方案的只读包装组件
  - HtmlTreeRenderer.vue - 新方案，基于真实 HTML DOM 渲染（支持文字选中/图片显示）
  
  切换方式：在 view_research_tree.vue 中使用 renderMode 切换
  ============================================================================
-->
<template>
  <section class="mind-map-workbench" :class="{ 'is-readonly': readOnly }">
    <!-- ============ 顶部固定工具栏（可收起） ============ -->
    <button
      v-if="!readOnly"
      type="button"
      class="toolbar-toggle top"
      :class="{ collapsed: toolbarCollapsed }"
      :title="toolbarCollapsed ? '展开工具栏' : '收起工具栏'"
      :aria-expanded="!toolbarCollapsed"
      @click="toggleToolbar"
    >
      {{ toolbarCollapsed ? "▾" : "▴" }}
    </button>

    <header
      v-show="!readOnly && !toolbarCollapsed"
      class="command-bar floating"
      :class="{ 'menu-open': layoutMenuOpen || moreMenuOpen }"
    >
      <div class="command-group">
        <button type="button" title="撤销 Ctrl+Z" @click="run('BACK')">↩ 撤销</button>
        <button type="button" title="重做 Ctrl+Y" @click="run('FORWARD')">↪ 重做</button>
        <button type="button" class="primary" title="保存 .xur 到本地" @click="saveXur">保存</button>
      </div>

      <!-- 布局：二次选项菜单 -->
      <div class="command-group">
        <div v-if="!readOnly" class="io-dropdown" :class="{ open: layoutMenuOpen }">
          <button
            type="button"
            class="io-dropdown-btn"
            :aria-expanded="layoutMenuOpen"
            @click.stop="toggleDropdown('layout')"
          >
            ▤ 布局 ▾
          </button>
          <div v-show="layoutMenuOpen" class="io-dropdown-menu">
            <label class="menu-select">
              <span>树形</span>
              <select v-model="layoutName" @change="changeLayout">
                <option value="logicalStructure">矩形进化树</option>
                <option value="logicalStructureLeft">向左矩形树</option>
                <option value="mindMap">双向辐射树</option>
                <option value="organizationStructure">层级树</option>
                <option value="catalogOrganization">目录树</option>
              </select>
            </label>
            <label class="menu-check">
              <input v-model="hideInternalNames" type="checkbox" @change="updateEvolutionPresentation" />
              <span>隐藏内部节点</span>
            </label>
            <label class="menu-check">
              <input v-model="alignLeavesRight" type="checkbox" @change="updateEvolutionPresentation" />
              <span>叶子右对齐（矩形树）</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 视图缩放 -->
      <div class="command-group">
        <button type="button" title="让整棵树适应当前画布" @click="fitView">适应</button>
        <button type="button" title="根节点回到画布中央" @click="centerRoot">居中</button>
        <button type="button" title="缩小" @click="zoomOut">−</button>
        <button type="button" class="zoom-value" title="恢复 100%" @click="resetZoom">
          {{ zoomPercent }}%
        </button>
        <button type="button" title="放大" @click="zoomIn">＋</button>
        <button type="button" title="展开全部分类群" @click="expandAll">展开</button>
        <button type="button" title="收起全部分类群" @click="collapseAll">收起</button>
      </div>

      <!-- 浮动工具栏开关 -->
      <div class="command-group">
        <button
          type="button"
          class="floating-tools-toggle"
          :class="{ active: floatingToolsEnabled }"
          :aria-pressed="floatingToolsEnabled"
          @click="floatingToolsEnabled = !floatingToolsEnabled"
        >
          浮动工具栏{{ floatingToolsEnabled ? "已开启" : "已关闭" }}
        </button>
      </div>

      <!-- 更多：二次选项菜单（打开/导出/新建） -->
      <div class="command-group">
        <div class="io-dropdown" :class="{ open: moreMenuOpen }">
          <button
            type="button"
            class="io-dropdown-btn"
            :aria-expanded="moreMenuOpen"
            @click.stop="toggleDropdown('more')"
          >
            … ▾
          </button>
          <div v-show="moreMenuOpen" class="io-dropdown-menu">
            <button type="button" @click="closeDropdowns(); openFile()">打开（.xur / .xmind）</button>
            <label class="menu-group-label">导出</label>
            <button type="button" @click="closeDropdowns(); exportFile('xmind')">XMind</button>
            <button type="button" @click="closeDropdowns(); saveXur()">.xur</button>
            <button type="button" @click="closeDropdowns(); exportFile('pdf')">PDF</button>
            <button type="button" @click="closeDropdowns(); exportFile('png')">PNG</button>
            <button type="button" @click="closeDropdowns(); exportFile('svg')">SVG</button>
            <label class="menu-group-label">新建</label>
            <button type="button" class="danger" @click="closeDropdowns(); confirmNewDocument()">新建（先保存当前树）</button>
          </div>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".xur,.smm,.json,.xmind"
        hidden
        @change="loadFile"
      />
      <input
        ref="imageFileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        @change="loadLocalNodeImage"
      />
    </header>

    <div class="workspace-body">
      <div
        ref="mapContainer"
        class="mind-map-canvas"
        aria-label="生命进化树画布"
      ></div>

      <!-- ============ 选中节点的浮动属性工具栏 ============ -->
      <div
        v-if="!readOnly && selectedCount && floatingToolsEnabled"
        class="node-quick-bar"
        role="toolbar"
        aria-label="选中节点属性工具栏"
        @mousedown.stop
        @mouseup.stop
      >
        <span class="quick-label">{{ selectedTitle }}</span>
        <button
          type="button"
          :class="{ active: inspectorOpen }"
          title="节点属性面板"
          aria-label="节点属性面板"
          @click="inspectorOpen = !inspectorOpen"
        >
          ☰
        </button>
        <button
          type="button"
          :title="hasExtinctMarker ? '取消灭绝标志' : '添加灭绝标记 †'"
          @click="toggleExtinctMarker"
        >
          †
        </button>
        <button type="button" title="正文引用（引用标记绑定到节点）" @click="addAndBindCitation">
          [1]
        </button>
        <button type="button" title="关联内容（文章/树/外部链接）" @click="addContentLink('ARTICLE')">
          ⧉
        </button>
        <button type="button" title="选择本地图片" @click="chooseLocalNodeImage">
          ▧↑
        </button>
        <span class="quick-divider" aria-hidden="true"></span>
        <ColorPaletteInput v-model="inspector.color" label="文字" compact @change="applyStyle('color')" />
        <ColorPaletteInput v-model="inspector.lineColor" label="分支" compact @change="applyStyle('lineColor')" />
      </div>

      <!-- 属性面板：从浮动工具栏向上弹出（替代原右侧常驻侧边卡片） -->
      <aside
        v-if="!readOnly && inspectorOpen"
        class="inspector popup"
        :class="{ disabled: !selectedCount }"
      >
        <div class="inspector-heading">
          <div>
            <span class="eyebrow">节点属性</span>
            <strong>{{ selectedTitle }}</strong>
          </div>
          <button
            type="button"
            class="inspector-close"
            aria-label="关闭属性面板"
            @click="inspectorOpen = false"
          >
            ×
          </button>
        </div>

        <template v-if="selectedCount">
          <label class="field full-field">
            <span>分类群名称</span>
            <textarea
              v-model="inspector.text"
              :disabled="selectedCount !== 1"
              rows="3"
              placeholder="例如：人属 Homo"
              @change="applyText"
              @keydown.stop
            ></textarea>
          </label>
          <div class="name-actions">
            <button
              type="button"
              :disabled="selectedCount !== 1"
              :title="
                hasExtinctMarker
                  ? '取消分类群的灭绝标志'
                  : '在分类群名称前添加灭绝符号 †'
              "
              @click="toggleExtinctMarker"
            >
              {{ hasExtinctMarker ? "移除 †" : "加 †" }}
            </button>
            <button
              type="button"
              :disabled="selectedCount !== 1"
              title="重置为全树默认直线型"
              @click="resetShape"
            >
              直线型
            </button>
          </div>

          <section class="inspector-section">
            <span class="section-title">引用</span>
            <div class="citation-row">
              <button
                type="button"
                :disabled="selectedCount !== 1"
                @click="bindExistingCitation"
              >
                绑定已有引用
              </button>
              <button
                type="button"
                :disabled="selectedCount !== 1"
                @click="addAndBindCitation"
              >
                新建并绑定
              </button>
            </div>
            <div v-if="inspector.citationNumbers.length" class="citation-numbers">
              <button
                v-for="citation in sortedCitations"
                :key="citation.number"
                type="button"
                :class="{ bound: inspector.citationNumbers.includes(citation.number) }"
                @click="toggleNodeCitation(citation.number)"
              >
                [{{ citation.number }}]
              </button>
            </div>
          </section>

          <section class="inspector-section">
            <span class="section-title">关联内容</span>
            <div class="citation-row">
              <button
                type="button"
                :disabled="selectedCount !== 1 || inspector.contentLinks.length >= 20"
                @click="addContentLink('ARTICLE')"
              >
                文章
              </button>
              <button
                type="button"
                :disabled="selectedCount !== 1 || inspector.contentLinks.length >= 20"
                @click="addContentLink('TREE')"
              >
                进化树
              </button>
              <button
                type="button"
                :disabled="selectedCount !== 1 || inspector.contentLinks.length >= 20"
                @click="addContentLink('EXTERNAL')"
              >
                外部链接
              </button>
            </div>
            <p
              v-if="!inspector.contentLinks.length"
              class="content-links-empty"
            >
              此节点尚未关联文章、进化树或外部链接。
            </p>
            <small v-if="contentCatalogLoading" class="content-catalog-state">
              正在读取站内内容列表……
            </small>
          </section>

          <label class="field full-field">
            <span>图片地址</span>
            <input
              v-model="inspector.image"
              :disabled="selectedCount !== 1"
              type="url"
              placeholder="https://.../species.jpg"
              @change="applyImage"
              @keydown.stop
            />
          </label>
          <div class="local-image-row">
            <button
              type="button"
              :disabled="selectedCount !== 1"
              @click="chooseLocalNodeImage"
            >
              选择本地图片
            </button>
            <small>选择后立即预览，发布时上传；刷新页面前请先保存 .xur</small>
          </div>
          <figure v-if="nodeImagePreview" class="node-image-preview">
            <img
              :src="nodeImagePreview"
              :alt="inspector.text || '节点图片预览'"
              @load="imagePreviewFailed = false"
              @error="imagePreviewFailed = true"
            />
            <figcaption>
              {{
                imagePreviewFailed
                  ? "图片暂时无法加载，请检查地址或跨域限制"
                  : "节点图片实时预览"
              }}
            </figcaption>
          </figure>

          <div class="color-grid">
            <ColorPaletteInput
              v-model="inspector.color"
              label="文字"
              @change="applyStyle('color')"
            />
            <ColorPaletteInput
              v-model="inspector.fillColor"
              label="节点背景"
              @change="applyStyle('fillColor')"
            />
            <ColorPaletteInput
              v-model="inspector.lineColor"
              label="分支"
              @change="applyStyle('lineColor')"
            />
          </div>

          <label class="field full-field">
            <span>节点形状</span>
            <select v-model="inspector.shape" @change="applyShape">
              <option value="line">直线型（全树）</option>
              <option value="dashedRectangle">虚线矩形</option>
              <option value="roundedRectangle">圆角矩形</option>
              <option value="rectangle">矩形</option>
              <option value="ellipse">椭圆</option>
              <option value="diamond">菱形</option>
              <option value="circle">圆形</option>
            </select>
          </label>

          <div class="inspector-actions">
            <button type="button" @click="moveNode('UP_NODE')">上移</button>
            <button type="button" @click="moveNode('DOWN_NODE')">下移</button>
            <button type="button" @click="toggleExpand">展开/折叠</button>
          </div>
        </template>

        <div v-else class="empty-inspector">
          <span class="empty-icon">⌁</span>
          <p>选择一个节点后，可编辑名称、链接、图片与颜色。</p>
        </div>
      </aside>
    </div>

      <!-- ============ 底部悬浮建树工具栏（可收起） ============ -->
      <button
        v-if="!readOnly"
        type="button"
        class="toolbar-toggle bottom"
        :class="{ collapsed: buildBarCollapsed }"
        :title="buildBarCollapsed ? '展开建树工具栏' : '收起建树工具栏'"
        :aria-expanded="!buildBarCollapsed"
        @click="buildBarCollapsed = !buildBarCollapsed"
      >
        {{ buildBarCollapsed ? "▴" : "▾" }}
      </button>

      <div
        v-show="!readOnly && !buildBarCollapsed"
        class="build-bar"
        role="toolbar"
        aria-label="建树工具栏"
        @mousedown.stop
        @mouseup.stop
        @click.stop
      >
        <button type="button" title="添加同级节点 Enter" @click="addSibling">同级</button>
        <button type="button" title="添加子节点 Tab" @click="addChild">子节点</button>
        <button type="button" title="在当前节点上方插入父节点" @click="addParent">父节点</button>
        <button
          type="button"
          title="自由主题：从当前节点拉虚线箭头关联其他节点（点击目标节点完成）"
          @click="startAssociativeLine"
        >
          自由主题
        </button>
        <button
          type="button"
          title="概要：为当前节点及其后代添加花括号注释"
          @click="addGeneralization"
        >
          概要
        </button>
        <span class="quick-divider" aria-hidden="true"></span>
        <button type="button" title="删除选中节点上的概要（先双击选中概要文字）" @click="removeGeneralization">删概要</button>
        <button type="button" title="删除选中的关联线（先点选虚线使其高亮）" @click="removeActiveAssociativeLine">删关联线</button>
        <span class="quick-divider" aria-hidden="true"></span>
        <button type="button" class="danger" title="删除 Delete" @click="removeNodes">删除</button>
      </div>

    <footer class="status-bar">
      <span class="status-dot" aria-hidden="true"></span>
      <span>{{ nodeCount }} 个分类群</span>
      <span v-if="fileOwner">{{ fileOwner }}</span>
      <span class="shortcut-hint">
        双击编辑名称 · Tab 加子节点 · Enter 加同级 · Ctrl+Z 撤销
      </span>
      <span class="engine-mark">simple-mind-map</span>
    </footer>
  </section>
</template>

<script setup>
import {
  computed,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import MindMap from "simple-mind-map";
import AssociativeLine from "simple-mind-map/src/plugins/AssociativeLine.js";
import Drag from "simple-mind-map/src/plugins/Drag.js";
import Export from "simple-mind-map/src/plugins/Export.js";
import KeyboardNavigation from "simple-mind-map/src/plugins/KeyboardNavigation.js";
import Select from "simple-mind-map/src/plugins/Select.js";
import TouchEvent from "simple-mind-map/src/plugins/TouchEvent.js";
import "simple-mind-map/dist/simpleMindMap.esm.css";
import ColorPaletteInput from "@/components/ColorPaletteInput.vue";
import {
  countMindMapNodes,
  createInitialMindMapDocument,
  createXurFile,
  normalizeMindMapDocument,
  normalizeContentLinks,
  normalizeNodeCitationNumbers,
  normalizeTreeCitations,
} from "@/utils/evolutionMindMapModel";
import { internalContentUrl } from "@/utils/articleLinks";
import { fetchPostList } from "@/services/posts";
import { fetchTreeList } from "@/services/trees";
import {
  blobToDataUrl,
  countLocalTreeImages,
  prepareImageBlob,
} from "@/utils/mediaImages";
import { clonePlainData } from "@/utils/plainData";

MindMap.usePlugin(Drag)
  .usePlugin(Select)
  .usePlugin(TouchEvent)
  .usePlugin(KeyboardNavigation)
  .usePlugin(AssociativeLine)
  .usePlugin(Export);

const props = defineProps({
  modelValue: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  fileOwner: { type: String, default: "生命时序" },
  citationAnchorPrefix: { type: String, default: "tree-citation" },
  currentTreeId: { type: String, default: "" },
  toolbarCollapsed: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:modelValue",
  "ready",
  "error",
  "content-links",
  "update:toolbarCollapsed",
]);

const mapContainer = ref(null);
const fileInput = ref(null);
const imageFileInput = ref(null);
const mindMap = shallowRef(null);
const activeNodes = shallowRef([]);
const zoomPercent = ref(100);
// 全页画布模式：工具栏浮在画布上方，可收起成一个把手（状态由父组件持有）
function toggleToolbar() {
  emit("update:toolbarCollapsed", !props.toolbarCollapsed);
}
const nodeCount = ref(countMindMapNodes(props.modelValue?.root));
const treeCitations = ref(normalizeTreeCitations(props.modelValue?.citations));
const citationToBind = ref("");
const newCitationText = ref("");

// 顶部/底部工具栏状态
const layoutMenuOpen = ref(false);
const moreMenuOpen = ref(false);
const buildBarCollapsed = ref(false);
const floatingToolsEnabled = ref(true);
// 属性弹出面板（原右侧常驻侧边卡片，现由浮动工具栏的 ☰ 按钮开关）
const inspectorOpen = ref(false);

// 二级下拉菜单：互斥打开；点击页面其他位置或按 Esc 关闭
function toggleDropdown(which) {
  if (which === "layout") {
    layoutMenuOpen.value = !layoutMenuOpen.value;
    moreMenuOpen.value = false;
  } else {
    moreMenuOpen.value = !moreMenuOpen.value;
    layoutMenuOpen.value = false;
  }
}

function closeDropdowns() {
  layoutMenuOpen.value = false;
  moreMenuOpen.value = false;
}

function handleDocumentClickForDropdowns(event) {
  if (!layoutMenuOpen.value && !moreMenuOpen.value) return;
  if (event.target.closest?.(".io-dropdown")) return;
  closeDropdowns();
}

function handleKeydownForDropdowns(event) {
  if (event.key === "Escape") closeDropdowns();
}

const sortedCitations = computed(() =>
  [...treeCitations.value].sort((a, b) => a.number - b.number),
);

// 点击引用编号徽章：已绑定则移除，未绑定则绑定
function toggleNodeCitation(number) {
  const bound = inspector.citationNumbers.includes(number);
  updateSelectedNodeCitations(
    bound
      ? inspector.citationNumbers.filter((candidate) => candidate !== number)
      : [...inspector.citationNumbers, number],
  );
  statusText.value = bound
    ? `已移除当前节点的引用 [${number}]`
    : `已将参考文献 [${number}] 绑定到当前节点`;
}

// 新建前强制把当前树保存到本地（.xur），避免未保存内容丢失
async function confirmNewDocument() {
  const confirmed = window.confirm(
    "新建前会先把当前树保存为 .xur 到本地，然后再替换画布。继续吗？",
  );
  if (!confirmed) return;
  try {
    await saveXur();
  } catch (error) {
    window.alert(`本地保存失败：${error?.message || "未知错误"}\n已取消新建。`);
    return;
  }
  newDocument();
}
const imagePreviewFailed = ref(false);
const availablePosts = ref([]);
const availableTrees = ref([]);
const contentCatalogLoading = ref(false);
const layoutName = ref(props.modelValue?.layout || "logicalStructure");
const nodeLineStyle = ref(props.modelValue?.evolution?.nodeLineStyle !== false);
const hideInternalNames = ref(
  Boolean(props.modelValue?.evolution?.hideInternalNames),
);
const alignLeavesRight = ref(
  Boolean(props.modelValue?.evolution?.alignLeavesRight),
);
const statusText = ref(props.readOnly ? "只读浏览" : "准备就绪");
const inspector = reactive({
  text: "",
  contentLinks: [],
  citationNumbers: [],
  image: "",
  color: "#000000",
  fillColor: "#ffffff",
  lineColor: "#000000",
  shape: "roundedRectangle",
});

let resizeObserver = null;
let lastPublished = "";
let viewPublishTimer = null;
let connectorGuideGroup = null;
let readOnlyFullRenderPending = false;
let readOnlyFullRenderTimer = null;
const EVOLUTION_LINE_WIDTH = 1;
const DASHED_NODE_SHAPE = "dashedRectangle";
const DASHED_NODE_PATTERN = "7 5";
const READ_ONLY_FULL_RENDER_COMMANDS = new Set([
  "SET_NODE_EXPAND",
  "EXPAND_ALL",
  "UNEXPAND_ALL",
]);

const selectedCount = computed(() => activeNodes.value.length);
const hasExtinctMarker = computed(() => /^\s*†/.test(inspector.text));
const selectedTitle = computed(() => {
  if (!selectedCount.value) return "未选择";
  if (selectedCount.value > 1) return `${selectedCount.value} 个节点`;
  return inspector.text || "未命名节点";
});
const selectedNodeCitations = computed(() => {
  const selected = new Set(inspector.citationNumbers);
  return treeCitations.value.filter((citation) =>
    selected.has(citation.number),
  );
});
const availableNodeCitations = computed(() => {
  const selected = new Set(inspector.citationNumbers);
  return treeCitations.value.filter(
    (citation) => !selected.has(citation.number),
  );
});
const nextCitationNumber = computed(() => {
  return (
    Math.max(
      0,
      ...treeCitations.value.map((citation) => Number(citation.number) || 0),
    ) + 1
  );
});
const nodeImagePreview = computed(() => {
  const source = String(inspector.image || "").trim();
  if (
    /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(source) ||
    (source.startsWith("/media/") && !source.startsWith("//"))
  )
    return source;
  try {
    const url = new URL(source);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
});

function activeNodeOrRoot() {
  return activeNodes.value[0] || mindMap.value?.renderer?.root || null;
}

function refreshInspector(nodes = activeNodes.value) {
  activeNodes.value = nodes.map((node) => markRaw(node));
  const node = activeNodes.value[0];
  const data = node?.getData?.() || {};
  inspector.text = data.text || "";
  inspector.contentLinks = normalizeContentLinks(
    data.contentLinks ?? data.articleLinks,
  ).map((link) => ({ ...link }));
  inspector.citationNumbers = normalizeNodeCitationNumbers(
    data.citationNumbers,
    new Set(treeCitations.value.map((citation) => citation.number)),
  );
  inspector.image = data.image || "";
  citationToBind.value = "";
  newCitationText.value = "";
  imagePreviewFailed.value = false;
  inspector.color = data.color || "#000000";
  inspector.fillColor = data.fillColor || "#ffffff";
  inspector.lineColor = data.lineColor || "#000000";
  inspector.shape = nodeLineStyle.value
    ? "line"
    : data.borderDasharray
      ? DASHED_NODE_SHAPE
      : data.shape || "roundedRectangle";
}

function currentDocument() {
  const source = mindMap.value.getData(true);
  source.citations = normalizeTreeCitations(treeCitations.value);
  const document = normalizeMindMapDocument(source);
  document.evolution = {
    nodeLineStyle: nodeLineStyle.value,
    hideInternalNames: hideInternalNames.value,
    alignLeavesRight: alignLeavesRight.value,
  };
  document.theme.config.nodeUseLineStyle = nodeLineStyle.value;
  return document;
}

function syncEvolutionOptions(document) {
  treeCitations.value = normalizeTreeCitations(document.citations);
  nodeLineStyle.value = document.evolution?.nodeLineStyle !== false;
  hideInternalNames.value = Boolean(document.evolution?.hideInternalNames);
  alignLeavesRight.value = Boolean(document.evolution?.alignLeavesRight);
}

function walkRenderedNodes(node, callback) {
  if (!node) return;
  callback(node);
  (node.children || []).forEach((child) => walkRenderedNodes(child, callback));
}

function removeReadOnlyTextLink(node) {
  const linkBinding = node?.__evolutionTextLink;
  if (linkBinding) {
    linkBinding.element.removeEventListener("click", linkBinding.open);
    linkBinding.element.removeEventListener("keydown", linkBinding.onKeydown);
    delete node.__evolutionTextLink;
  }
  node?._textData?.node?.removeClass?.("evolution-readonly-text-link");
  node?._textData?.node?.removeClass?.("evolution-article-text");
  node?._textData?.node?.attr?.({
    role: null,
    tabindex: null,
    "aria-label": null,
  });
}

function citationTargetId(number) {
  const prefix = /^[a-z][a-z0-9_-]{0,40}$/i.test(props.citationAnchorPrefix)
    ? props.citationAnchorPrefix
    : "tree-citation";
  return `${prefix}-${number}`;
}

function removeNodeCitationBadge(node) {
  const binding = node?.__evolutionCitationBadge;
  if (!binding) return;
  (binding.listeners || []).forEach(({ element, open, onKeydown }) => {
    element.removeEventListener("click", open);
    element.removeEventListener("keydown", onKeydown);
  });
  binding.badge?.remove?.();
  delete node.__evolutionCitationBadge;
}

function applyNodeCitationBadge(node) {
  removeNodeCitationBadge(node);
  if (hideInternalNames.value && node.nodeData?.children?.length) return;
  const available = new Set(
    treeCitations.value.map((citation) => citation.number),
  );
  const numbers = normalizeNodeCitationNumbers(
    node.getData?.("citationNumbers"),
    available,
  );
  if (!numbers.length || !node.group?.group) return;

  const fontSize = Math.max(
    10,
    Math.round(Number(node.getData?.("fontSize") || 15) * 0.68),
  );
  const badge = node.group.group().addClass("evolution-node-citations");
  const listeners = [];
  let offsetX = 0;
  numbers.forEach((number) => {
    const marker = badge
      .text(`[${number}]`)
      .addClass("evolution-node-citation");
    marker
      .font({
        family: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
        size: fontSize,
        weight: 800,
      })
      .fill("#1683d8")
      .attr({
        "dominant-baseline": "auto",
        "aria-label": `跳转到参考文献 [${number}]`,
      });
    marker.move(offsetX, 0);
    offsetX += marker.bbox?.().width || fontSize * 2;
    if (!props.readOnly || !marker.node) return;

    const element = marker.node;
    const open = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const target = window.document.getElementById(citationTargetId(number));
      if (!target) return;
      window.history.replaceState(null, "", `#${target.id}`);
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
    };
    const onKeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") open(event);
    };
    marker.attr({ role: "link", tabindex: 0, cursor: "pointer" });
    element.addEventListener("click", open);
    element.addEventListener("keydown", onKeydown);
    listeners.push({ element, open, onKeydown });
  });
  badge.move(Math.max(0, node.width - offsetX), -fontSize * 0.9);

  if (!props.readOnly) {
    badge.attr({ "pointer-events": "none" });
    node.__evolutionCitationBadge = { badge, listeners };
    return;
  }
  node.__evolutionCitationBadge = { badge, listeners };
}

function getSafeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function applyReadOnlyTextLink(node) {
  removeReadOnlyTextLink(node);
  if (hideInternalNames.value && node.nodeData?.children?.length) return;

  const data = node.getData?.() || {};
  const links = normalizeContentLinks(data.contentLinks ?? data.articleLinks);
  const textNode = node._textData?.node;
  const element = textNode?.node;
  if (!links.length || !element) return;
  textNode.addClass("evolution-article-text");
  if (!props.readOnly) return;

  const open = (event) => {
    event.preventDefault();
    event.stopPropagation();
    emit("content-links", {
      nodeUid: String(node.getData?.("uid") || ""),
      nodeTitle: String(node.getData?.("text") || "未命名节点"),
      links: links.map((link) => ({ ...link })),
    });
  };
  const onKeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") open(event);
  };

  textNode.addClass("evolution-readonly-text-link");
  textNode.attr({
    role: "link",
    tabindex: 0,
    "aria-label": `查看关联内容：${node.getData("text") || "未命名节点"}`,
  });
  element.addEventListener("click", open);
  element.addEventListener("keydown", onKeydown);
  node.__evolutionTextLink = { element, open, onKeydown };
}

function restoreEvolutionPresentation(instance = mindMap.value) {
  connectorGuideGroup?.remove?.();
  connectorGuideGroup = null;

  walkRenderedNodes(instance?.renderer?.root, (node) => {
    removeReadOnlyTextLink(node);
    removeNodeCitationBadge(node);
    node._textData?.node?.opacity?.(1);
    (node._lines || []).forEach((line) => line.opacity?.(1));
    if (!Number.isFinite(node.__evolutionOriginalLeft)) return;

    const transform = node.group?.transform?.();
    if (transform && node.group) {
      node.group.translate(
        node.__evolutionOriginalLeft - transform.translateX,
        node.top - transform.translateY,
      );
    }
    node.left = node.__evolutionOriginalLeft;
    delete node.__evolutionOriginalLeft;
  });
}

function drawLogicalConnectors(instance, nodes) {
  if (
    !nodeLineStyle.value ||
    !["logicalStructure", "logicalStructureLeft"].includes(layoutName.value)
  )
    return;

  const isLeft = layoutName.value === "logicalStructureLeft";
  const layout = instance?.renderer?.layout;
  if (!layout?.getMarginX) return;

  const alwaysShowExpandBtn = Boolean(
    instance.getConfig("alwaysShowExpandBtn"),
  );
  const notShowExpandBtn = Boolean(instance.getConfig("notShowExpandBtn"));
  // Keep the baseline above the opaque node rectangle. When it lives in
  // lineDraw, the node fill covers half of the 2px stroke at child.left,
  // making one continuous connector look like two different widths.
  connectorGuideGroup = instance.otherDraw
    .group()
    .addClass("evolution-uniform-connectors");
  connectorGuideGroup.attr({ "pointer-events": "none" });

  const segments = [];
  const dashedSegments = [];
  const addSegment = (x1, y1, x2, y2, color, dashed = false) => {
    if (![x1, y1, x2, y2].every(Number.isFinite)) return;
    const segmentColor = /^#[0-9a-f]{6}$/i.test(color || "")
      ? color
      : "#000000";
    const target = dashed ? dashedSegments : segments;
    if (Math.abs(y1 - y2) < 0.01) {
      target.push({
        direction: "h",
        color: segmentColor,
        axis: (y1 + y2) / 2,
        start: Math.min(x1, x2),
        end: Math.max(x1, x2),
      });
    } else if (Math.abs(x1 - x2) < 0.01) {
      target.push({
        direction: "v",
        color: segmentColor,
        axis: (x1 + x2) / 2,
        start: Math.min(y1, y2),
        end: Math.max(y1, y2),
      });
    }
  };

  nodes.forEach((node) => {
    const children = node.children || [];
    if (!children.length) return;

    // simple-mind-map repeats the shared trunk once for every child. Keep its
    // paths intact for interaction, but hide them and paint each segment once.
    (node._lines || []).forEach((line) => line.opacity?.(0));

    let expandBtnSize = node.expandBtnSize || 0;
    if (!alwaysShowExpandBtn || notShowExpandBtn || node.isRoot)
      expandBtnSize = 0;

    const marginX = layout.getMarginX(node.layerIndex + 1);
    const branchOffset = (marginX - expandBtnSize) * 0.6;
    const parentX = isLeft
      ? node.left - expandBtnSize
      : node.left + node.width + expandBtnSize;
    const branchX = isLeft ? parentX - branchOffset : parentX + branchOffset;
    const parentY = node.isRoot
      ? node.top + node.height / 2
      : node.top + node.height;
    const childLines = children.map((child) => ({
      y: child.top + child.height,
      left: child.left,
      width: child.width,
      originalLeft: child.__evolutionOriginalLeft,
      endX: isLeft ? child.left : child.left + child.width,
      color:
        child.getData?.("lineColor") || child.getStyle?.("lineColor", true),
    }));
    const parentColor =
      node.getData?.("lineColor") || node.getStyle?.("lineColor", true);
    const verticalPoints = [parentY, ...childLines.map((child) => child.y)];
    const minY = Math.min(...verticalPoints);
    const maxY = Math.max(...verticalPoints);
    addSegment(parentX, parentY, branchX, parentY, parentColor);
    addSegment(branchX, minY, branchX, maxY, parentColor);
    childLines.forEach((child) => {
      if (!isLeft && Number.isFinite(child.originalLeft)) {
        // 叶节点右对齐时保留真实分支长度，并用虚线表示为了对齐而
        // 增加的空白距离；节点名称下方仍保留一段实线。
        addSegment(branchX, child.y, child.originalLeft, child.y, child.color);
        addSegment(
          child.originalLeft,
          child.y,
          child.left,
          child.y,
          child.color,
          true,
        );
        addSegment(
          child.left,
          child.y,
          child.left + child.width,
          child.y,
          child.color,
        );
      } else {
        addSegment(branchX, child.y, child.endX, child.y, child.color);
      }
    });
  });

  const drawSegments = (source, dasharray = null) => {
    // Merge collinear segments across the entire tree. This also removes overlap
    // between adjacent generations, so no area can become darker or thicker.
    const grouped = new Map();
    source.forEach((segment) => {
      const key = `${segment.color}:${segment.direction}:${segment.axis.toFixed(2)}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(segment);
    });
    const merged = [];
    grouped.forEach((group) => {
      group.sort((left, right) => left.start - right.start);
      group.forEach((segment) => {
        const previous = merged[merged.length - 1];
        if (
          previous &&
          previous.direction === segment.direction &&
          previous.color === segment.color &&
          Math.abs(previous.axis - segment.axis) < 0.01 &&
          segment.start <= previous.end + 0.01
        ) {
          previous.end = Math.max(previous.end, segment.end);
        } else {
          merged.push({ ...segment });
        }
      });
    });

    const pathsByColor = new Map();
    merged.forEach((segment) => {
      const { direction, axis, start, end, color } = segment;
      const command =
        direction === "h"
          ? `M ${start},${axis} L ${end},${axis}`
          : `M ${axis},${start} L ${axis},${end}`;
      pathsByColor.set(color, [...(pathsByColor.get(color) || []), command]);
    });
    pathsByColor.forEach((commands, color) => {
      connectorGuideGroup
        .path(commands.join(" "))
        .fill("none")
        .stroke({
          color,
          width: EVOLUTION_LINE_WIDTH,
          ...(dasharray ? { dasharray } : {}),
          linecap: "butt",
          linejoin: "miter",
        })
        .attr({
          "vector-effect": "non-scaling-stroke",
          "shape-rendering": "geometricPrecision",
        });
    });
  };

  drawSegments(segments);
  drawSegments(dashedSegments, "7 6");
}

function applyEvolutionPresentation(instance = mindMap.value) {
  const root = instance?.renderer?.root;
  if (!root) return;

  restoreEvolutionPresentation(instance);
  const nodes = [];
  walkRenderedNodes(root, (node) => nodes.push(node));

  nodes.forEach((node) => {
    (node._lines || []).forEach((line) =>
      line
        .stroke({
          width: EVOLUTION_LINE_WIDTH,
          linecap: "butt",
          linejoin: "miter",
        })
        .attr({
          "vector-effect": "non-scaling-stroke",
          "shape-rendering": "geometricPrecision",
        }),
    );
  });

  if (hideInternalNames.value) {
    nodes
      .filter((node) => node.nodeData?.children?.length > 0)
      .forEach((node) => node._textData?.node?.opacity?.(0));
  }

  nodes.forEach((node) => {
    applyReadOnlyTextLink(node);
    applyNodeCitationBadge(node);
  });

  if (alignLeavesRight.value && layoutName.value === "logicalStructure") {
    const leaves = nodes.filter(
      (node) =>
        node.nodeData?.children?.length === 0 && node.group && !node.isRoot,
    );

    if (leaves.length >= 2) {
      const targetRight =
        Math.max(...leaves.map((node) => node.left + node.width)) + 72;

      leaves.forEach((node) => {
        const originalLeft = node.left;
        const transform = node.group.transform();
        const alignedLeft = targetRight - node.width;

        node.__evolutionOriginalLeft = originalLeft;
        node.group.translate(
          alignedLeft - transform.translateX,
          node.top - transform.translateY,
        );
        node.left = alignedLeft;
      });
    }
  }

  // Draw after every presentation-time movement so lines use final positions.
  drawLogicalConnectors(instance, nodes);
}

function updateEvolutionPresentation() {
  if (props.readOnly && mindMap.value) {
    const instance = mindMap.value;
    readOnlyFullRenderPending = false;
    window.clearTimeout(readOnlyFullRenderTimer);
    restoreEvolutionPresentation(instance);
    instance.reRender(() => {}, "readonly-presentation-change");
    return;
  }
  applyEvolutionPresentation();
  publishDocument();
}

function publishDocument() {
  if (!mindMap.value) return;
  // 只读页中的折叠、布局和视角变化只属于当前浏览会话。
  // 在读取、规范化文档之前直接停止，避免通过 v-model/watch 触发 setFullData 重绘。
  if (props.readOnly) return;
  const document = currentDocument();
  nodeCount.value = countMindMapNodes(document.root);
  layoutName.value = document.layout;
  lastPublished = JSON.stringify(document);
  emit("update:modelValue", document);
}

function scheduleViewPublish() {
  if (props.readOnly) return;
  window.clearTimeout(viewPublishTimer);
  viewPublishTimer = window.setTimeout(publishDocument, 240);
}

function run(command, ...args) {
  if (!mindMap.value) return;
  mindMap.value.execCommand(command, ...args);
}

function setAllNodesExpanded(expand) {
  // 工作台与观看页必须走同一个引擎命令。额外修改 renderTree 并手动
  // reRender 会绕过引擎的折叠状态管理，留下上一轮的节点和连接线。
  run(expand ? "EXPAND_ALL" : "UNEXPAND_ALL");
}

function expandAll() {
  setAllNodesExpanded(true);
}

function collapseAll() {
  setAllNodesExpanded(false);
}

function addChild() {
  const target = activeNodeOrRoot();
  if (target) run("INSERT_CHILD_NODE", true, [target], { text: "新分类群" });
}

function addSibling() {
  const target = activeNodeOrRoot();
  if (!target || target.isRoot) return addChild();
  run("INSERT_NODE", true, [target], { text: "新分类群" });
}

function addParent() {
  const target = activeNodeOrRoot();
  if (target && !target.isRoot) {
    run("INSERT_PARENT_NODE", true, [target], { text: "新分类群" });
  }
}

// 自由主题：从当前选中节点拉一条虚线箭头，点击目标节点完成关联
function startAssociativeLine() {
  const instance = mindMap.value;
  if (!instance?.associativeLine) return;
  instance.associativeLine.createLineFromActiveNode();
}

// 概要：为选中节点（及其后代范围）添加花括号注释，创建后自动进入文字编辑。
// 库会在概要数据上打 inserting 标记、渲染后自动打开编辑框。按钮点击引发的
// 一连串 hideEditTextBox（命令执行 + body_click）会把刚打开的编辑框关掉。
// 不能直接吞掉 hide（会导致 hide_text_edit 不触发、keyCommand.save() 后
// 永不 restore，快捷键全部失效）：改为收集 300ms 内的 hide 调用延后执行，
// 让概要编辑框先完成打开；期间排队的 hide 若在编辑框打开前发生则直接跳过，
// 打开后到达的 hide 正常放行（用户主动点击画布仍可关闭编辑）。
function addGeneralization() {
  if (!activeNodes.value.length) return;
  const instance = mindMap.value;
  if (!instance?.renderer?.textEdit) {
    run("ADD_GENERALIZATION");
    return;
  }
  const textEdit = instance.renderer.textEdit;
  const originalHide = textEdit.hideEditTextBox.bind(textEdit);
  let editBoxShown = false;
  const onShow = () => {
    editBoxShown = true;
  };
  instance.on("before_show_text_edit", onShow);
  textEdit.hideEditTextBox = () => {
    // 编辑框尚未打开时，这个 hide 属于按钮点击的连带事件，忽略
    if (!editBoxShown) return;
    textEdit.hideEditTextBox = originalHide;
    originalHide();
  };
  try {
    run("ADD_GENERALIZATION", true, { text: "概要注释" }, true);
  } finally {
    window.setTimeout(() => {
      instance.off("before_show_text_edit", onShow);
      if (textEdit.hideEditTextBox !== originalHide) {
        textEdit.hideEditTextBox = originalHide;
      }
    }, 300);
  }
}

// 删除选中节点上的概要（进入概要节点选中态后可用）
function removeGeneralization() {
  run("REMOVE_GENERALIZATION");
}

// 删除当前激活的关联线（先点选关联线使其激活）
function removeActiveAssociativeLine() {
  mindMap.value?.associativeLine?.removeLine?.();
}

function removeNodes() {
  if (activeNodes.value.some((node) => node.isRoot)) return;
  run("REMOVE_NODE");
}

function moveNode(command) {
  if (selectedCount.value === 1) run(command);
}

function toggleExpand() {
  activeNodes.value.forEach((node) => {
    if (!node.isRoot && node.nodeData?.children?.length) {
      run("SET_NODE_EXPAND", node, node.getData("expand") === false);
    }
  });
}

function applyText() {
  const node = activeNodes.value[0];
  if (node && selectedCount.value === 1)
    node.setText(inspector.text.trim() || "未命名分类群");
}

function toggleExtinctMarker() {
  const node = activeNodes.value[0];
  if (!node || selectedCount.value !== 1) return;
  inspector.text = hasExtinctMarker.value
    ? inspector.text.replace(/^\s*†\s*/, "") || "未命名分类群"
    : `†${inspector.text.trimStart() || "未命名分类群"}`;
  node.setText(inspector.text);
  statusText.value = hasExtinctMarker.value
    ? "已添加灭绝标记 †"
    : "已取消灭绝标记 †";
}

function updateSelectedNodeCitations(numbers) {
  const node = activeNodes.value[0];
  if (!node || selectedCount.value !== 1) return;
  const available = new Set(
    treeCitations.value.map((citation) => citation.number),
  );
  inspector.citationNumbers = normalizeNodeCitationNumbers(numbers, available);
  node.setData({ citationNumbers: [...inspector.citationNumbers] });
  citationToBind.value = "";
  window.setTimeout(() => {
    applyEvolutionPresentation();
    publishDocument();
  }, 0);
}

function bindExistingCitation() {
  const number = Number(citationToBind.value);
  if (!Number.isSafeInteger(number)) return;
  updateSelectedNodeCitations([...inspector.citationNumbers, number]);
  statusText.value = `已将参考文献 [${number}] 绑定到当前节点`;
}

function removeNodeCitation(number) {
  updateSelectedNodeCitations(
    inspector.citationNumbers.filter((candidate) => candidate !== number),
  );
  statusText.value = `已移除当前节点的引用 [${number}]`;
}

function addAndBindCitation() {
  const text = newCitationText.value.trim();
  const number = nextCitationNumber.value;
  if (!text || treeCitations.value.length >= 200 || number > 9_999) return;
  treeCitations.value = normalizeTreeCitations([
    ...treeCitations.value,
    { number, text },
  ]);
  newCitationText.value = "";
  updateSelectedNodeCitations([...inspector.citationNumbers, number]);
  statusText.value = `已新增参考文献 [${number}] 并绑定当前节点`;
}

function addContentLink(type = "ARTICLE") {
  if (selectedCount.value !== 1 || inspector.contentLinks.length >= 20) return;
  inspector.contentLinks.push({
    type,
    targetId: "",
    title: "",
    url: "",
  });
}

function displayHostname(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.hostname : "必须使用 HTTPS";
  } catch {
    return "地址无效";
  }
}

function isCurrentTreeTarget(targetId) {
  const current = String(props.currentTreeId || "")
    .trim()
    .toLowerCase();
  return Boolean(
    current &&
    String(targetId || "")
      .trim()
      .toLowerCase() === current,
  );
}

function catalogItem(link) {
  const items =
    link.type === "TREE" ? availableTrees.value : availablePosts.value;
  const target = String(link.targetId || "")
    .trim()
    .toLowerCase();
  return items.find((item) =>
    [item.id, item.uid].some((id) => String(id || "").toLowerCase() === target),
  );
}

function chooseCatalogContent(link) {
  const item = catalogItem(link);
  if (item) {
    link.targetId = item.uid || item.id;
    link.title = item.title || link.title;
  }
  applyContentLinks();
}

function resetContentLink(link) {
  link.targetId = "";
  link.title = "";
  link.url = "";
  applyContentLinks();
}

function removeContentLink(index) {
  inspector.contentLinks.splice(index, 1);
  applyContentLinks();
}

function applyContentLinks() {
  const node = activeNodes.value[0];
  if (!node || selectedCount.value !== 1) return;
  const candidates = inspector.contentLinks
    .filter((link) =>
      link.type === "EXTERNAL"
        ? String(link.url || "").trim()
        : String(link.targetId || "").trim(),
    )
    .filter(
      (link) => link.type !== "TREE" || !isCurrentTreeTarget(link.targetId),
    )
    .map((link) => ({
      ...link,
      url:
        link.type === "EXTERNAL"
          ? link.url
          : internalContentUrl(link.type, link.targetId),
    }));
  const links = normalizeContentLinks(candidates);
  node.setData({ contentLinks: links, articleLinks: undefined });
  if (links.length !== candidates.length) {
    statusText.value =
      "关联目标无效、重复，或关联了当前进化树自身，未保存对应条目";
  } else {
    statusText.value = `已保存 ${links.length} 条关联内容`;
  }
  window.setTimeout(() => applyEvolutionPresentation(), 0);
}

function applyImage() {
  const node = activeNodes.value[0];
  if (!node || selectedCount.value !== 1) return;
  const candidate = getSafeHttpUrl(inspector.image);
  const url = candidate.startsWith("https:") ? candidate : "";
  if (!url && inspector.image.trim())
    statusText.value = "图片地址必须使用 HTTPS";
  node.setImage(
    url
      ? {
          url,
          title: inspector.text,
          width: 180,
          height: 110,
        }
      : { url: "", title: "", width: 0, height: 0 },
  );
}

function chooseLocalNodeImage() {
  if (selectedCount.value !== 1) return;
  imageFileInput.value?.click();
}

async function loadLocalNodeImage(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  const node = activeNodes.value[0];
  if (!file || !node || selectedCount.value !== 1) return;
  statusText.value = "正在压缩本地图片……";
  try {
    const prepared = await prepareImageBlob(file);
    inspector.image = prepared.dataUrl;
    node.setImage({
      url: prepared.dataUrl,
      title: inspector.text,
      width: Math.min(360, prepared.width),
      height: Math.round(
        (Math.min(360, prepared.width) * prepared.height) / prepared.width,
      ),
    });
    statusText.value = `本地图片已压缩为 ${(prepared.blob.size / 1024).toFixed(0)}KB，发布时上传`;
    window.setTimeout(publishDocument, 0);
  } catch (error) {
    handleError(error, "本地图片处理失败");
  }
}

function applyStyle(property) {
  activeNodes.value.forEach((node) =>
    node.setStyle(property, inspector[property]),
  );
  window.setTimeout(() => applyEvolutionPresentation(), 0);
}

function resetShape() {
  inspector.shape = "line";
  applyShape();
}

function applyShape() {
  if (inspector.shape === "line") {
    nodeLineStyle.value = true;
  } else {
    nodeLineStyle.value = false;
    activeNodes.value.forEach((node) => {
      if (inspector.shape === DASHED_NODE_SHAPE) {
        node.setShape("rectangle");
        node.setStyle("borderDasharray", DASHED_NODE_PATTERN);
        node.setStyle("borderWidth", 2);
        node.setStyle("borderColor", inspector.lineColor || "#000000");
      } else {
        node.setShape(inspector.shape);
        node.setStyle("borderDasharray", "");
      }
    });
  }
  mindMap.value?.setThemeConfig({
    ...mindMap.value.getCustomThemeConfig(),
    nodeUseLineStyle: nodeLineStyle.value,
  });
  window.setTimeout(() => {
    applyEvolutionPresentation();
    publishDocument();
  }, 0);
}

function changeLayout() {
  const instance = mindMap.value;
  if (!instance) return;

  // 叶子右对齐会临时移动 SVG 节点。切换布局前先还原，再让组件库只
  // 更新布局对象，随后清空画布和节点缓存做一次全量重绘，杜绝旧布局残影。
  restoreEvolutionPresentation(instance);
  instance.setLayout(layoutName.value, true);
  instance.reRender(() => {
    window.setTimeout(() => {
      if (mindMap.value !== instance) return;
      instance.view.fit();
      publishDocument();
    }, 0);
  }, "evolution-layout-change");
}

function zoomIn() {
  mindMap.value?.view.enlarge();
}

function zoomOut() {
  mindMap.value?.view.narrow();
}

function resetZoom() {
  mindMap.value?.view.setScale(1);
}

function fitView() {
  mindMap.value?.view.fit();
}

function centerRoot() {
  mindMap.value?.renderer.setRootNodeCenter();
}

function safeOwner() {
  const rootHtml =
    mindMap.value?.renderer?.root?.getData?.("text") ||
    props.modelValue?.root?.data?.text ||
    props.fileOwner ||
    "生命时序";
  const textContainer = document.createElement("div");
  textContainer.innerHTML = String(rootHtml);
  const filename = String(textContainer.textContent || "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\p{Cc}/gu, "_")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 80);
  return filename || "生命时序";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function saveXur() {
  const payload = createXurFile(currentDocument());
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    }),
    `${safeOwner()}.xur`,
  );
  statusText.value = "已保存新版 .xur";
}

function openFile() {
  fileInput.value?.click();
}

async function loadFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    let document;
    if (/\.xmind$/i.test(file.name)) {
      const { parseXmindTextFile } = await import("@/utils/xmindTextImport");
      const xmindRoot = await parseXmindTextFile(file);
      document = createInitialMindMapDocument();
      document.root = xmindRoot;
    } else {
      const payload = JSON.parse(await file.text());
      document = normalizeMindMapDocument(payload);
    }
    syncEvolutionOptions(document);
    mindMap.value.setFullData(document);
    layoutName.value = document.layout;
    refreshInspector([]);
    window.setTimeout(() => {
      fitView();
      publishDocument();
    }, 0);
    const importedImages = /\.xmind$/i.test(file.name)
      ? countLocalTreeImages(document.root)
      : 0;
    statusText.value = /\.xmind$/i.test(file.name)
      ? `已导入 ${file.name} 的结构和 ${importedImages} 张图片`
      : `已打开 ${file.name}`;
  } catch (error) {
    handleError(error, "无法解析该 .xur、.smm、JSON 或 XMind 文件");
  } finally {
    event.target.value = "";
  }
}

function newDocument() {
  if (!window.confirm("新建会替换当前画布，尚未保存的内容将丢失。继续吗？"))
    return;
  const document = createInitialMindMapDocument();
  syncEvolutionOptions(document);
  mindMap.value.setFullData(document);
  layoutName.value = document.layout;
  refreshInspector([]);
  window.setTimeout(() => {
    centerRoot();
    publishDocument();
  }, 0);
  statusText.value = "已新建进化树";
}

async function exportFile(type) {
  if (!mindMap.value) return;
  if (type === "xmind") {
    const linkCount = countDocumentContentLinks(currentDocument().root);
    if (
      linkCount &&
      !window.confirm(
        `XMind 不能完整保存节点关联内容，${linkCount} 条关联不会写入导出文件。请同时保存 .xur 作为完整版本。仍要继续吗？`,
      )
    ) {
      statusText.value = "已取消 XMind 导出";
      return;
    }
  }
  statusText.value = `正在导出 ${type.toUpperCase()}…`;
  try {
    await nextTick();
    await window.document.fonts?.ready;
    applyEvolutionPresentation();
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    if (type === "xmind") {
      const imageCount = await exportXmindFile();
      statusText.value = `XMind 导出完成，已打包 ${imageCount} 张图片`;
    } else if (type === "png") {
      await exportPngFile();
      statusText.value = "PNG 导出完成";
    } else if (type === "pdf") {
      await exportPdfFile();
      statusText.value = "PDF 导出完成";
    } else {
      await mindMap.value.export(type, true, safeOwner());
      statusText.value = `${type.toUpperCase()} 导出完成`;
    }
  } catch (error) {
    handleError(error, `${type.toUpperCase()} 导出失败`);
  }
}

function countDocumentContentLinks(node) {
  if (!node) return 0;
  return (
    normalizeContentLinks(node.data?.contentLinks ?? node.data?.articleLinks)
      .length +
    (node.children || []).reduce(
      (sum, child) => sum + countDocumentContentLinks(child),
      0,
    )
  );
}

async function createPngExport() {
  const dataUrl = await mindMap.value.doExport.png(safeOwner(), false);
  if (!/^data:image\/png(?:;|,)/i.test(String(dataUrl))) {
    throw new Error("画布没有生成有效的 PNG 数据");
  }
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("浏览器无法读取生成的 PNG 数据");
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength < 100) throw new Error("生成的 PNG 文件为空");
  return {
    dataUrl,
    blob: new Blob([bytes], { type: "image/png" }),
  };
}

async function exportPngFile() {
  const { blob } = await createPngExport();
  downloadBlob(blob, `${safeOwner()}.png`);
}

async function exportPdfFile() {
  const { dataUrl } = await createPngExport();
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(safeOwner());
  pdf.setCreator("生命时序");
  const image = await pdf.embedPng(dataUrl);
  const landscape = image.width >= image.height;
  const pageWidth = landscape ? 1190.55 : 841.89;
  const pageHeight = landscape ? 841.89 : 1190.55;
  const margin = 24;
  const scale = Math.min(
    (pageWidth - margin * 2) / image.width,
    (pageHeight - margin * 2) / image.height,
  );
  const width = image.width * scale;
  const height = image.height * scale;
  const page = pdf.addPage([pageWidth, pageHeight]);
  page.drawImage(image, {
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    width,
    height,
  });
  const bytes = await pdf.save();
  downloadBlob(
    new Blob([bytes], { type: "application/pdf" }),
    `${safeOwner()}.pdf`,
  );
}

async function exportXmindFile() {
  const root = clonePlainData(currentDocument().root, "XMind 导出数据");
  const imageNodes = [];
  (function collect(node) {
    if (!node) return;
    if (node.data?.image) imageNodes.push(node);
    (node.children || []).forEach(collect);
  })(root);

  for (const node of imageNodes) {
    const source = String(node.data.image || "");
    if (/^data:image\//i.test(source)) continue;
    let url;
    try {
      url = new URL(source, window.location.href);
    } catch {
      throw new Error(`节点“${node.data.text || "未命名"}”的图片地址无效`);
    }
    let response;
    try {
      response = await fetch(url, {
        credentials:
          url.origin === window.location.origin ? "same-origin" : "omit",
      });
    } catch {
      throw new Error(
        `节点“${node.data.text || "未命名"}”的外部图片禁止跨域读取，无法打包进 XMind`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `节点“${node.data.text || "未命名"}”的图片读取失败（${response.status}）`,
      );
    }
    const blob = await response.blob();
    if (!/^image\//i.test(blob.type || "")) {
      throw new Error(`节点“${node.data.text || "未命名"}”返回的不是图片`);
    }
    node.data.image = await blobToDataUrl(blob);
  }

  const { createXmindBlob } = await import("@/utils/xmindExport");
  const { blob, imageCount } = await createXmindBlob(root, safeOwner());
  downloadBlob(blob, `${safeOwner()}.xmind`);
  return imageCount;
}

function handleError(error, message = "操作失败") {
  console.error(error);
  statusText.value = message;
  emit("error", error);
  window.alert(`${message}：${error?.message || "未知错误"}`);
}

function bindMindMapEvents(instance, hasSavedView) {
  let needsInitialFit = !hasSavedView;
  instance.on("afterExecCommand", (command) => {
    if (props.readOnly && READ_ONLY_FULL_RENDER_COMMANDS.has(command)) {
      window.clearTimeout(readOnlyFullRenderTimer);
      readOnlyFullRenderPending = true;
    }
  });
  instance.on("node_mousedown", (node, event) => {
    if (props.readOnly || !event.shiftKey || event.which !== 1) return;
    node.isMultipleChoice = true;
    if (!node.getData("isActive")) {
      instance.emit(
        "before_node_active",
        node,
        instance.renderer.activeNodeList,
      );
      instance.renderer.addNodeToActiveList(node, true);
      instance.renderer.emitNodeActiveEvent(node);
    }
  });
  instance.on("node_active", (_node, nodes) => refreshInspector(nodes || []));
  instance.on("data_change", (root) => {
    nodeCount.value = countMindMapNodes(root);
    statusText.value = props.readOnly ? "浏览状态已更新" : "内容已更新";
    if (!props.readOnly) window.setTimeout(publishDocument, 0);
  });
  instance.on("scale", (scale) => {
    zoomPercent.value = Math.round(scale * 100);
    if (!props.readOnly) scheduleViewPublish();
  });
  if (!props.readOnly) instance.on("translate", scheduleViewPublish);
  instance.on("layout_change", (layout) => {
    layoutName.value = layout;
  });
  instance.on("node_tree_render_start", () =>
    restoreEvolutionPresentation(instance),
  );
  instance.on("node_tree_render_end", () => {
    if (props.readOnly && readOnlyFullRenderPending) {
      readOnlyFullRenderPending = false;
      window.clearTimeout(readOnlyFullRenderTimer);
      readOnlyFullRenderTimer = window.setTimeout(() => {
        if (mindMap.value !== instance) return;
        restoreEvolutionPresentation(instance);
        instance.reRender(() => {}, "readonly-topology-change");
      }, 0);
      return;
    }
    applyEvolutionPresentation(instance);
    if (needsInitialFit) {
      needsInitialFit = false;
      instance.view.fit();
    }
  });
}

async function stabilizeLayout(instance) {
  try {
    await window.document.fonts?.ready;
  } catch {
    // 字体 API 不可用时仍执行下一帧的重新布局。
  }
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
  if (mindMap.value !== instance) return;
  instance.reRender(() => {}, "font-layout-stabilized");
}

async function loadContentCatalog() {
  if (props.readOnly) return;
  contentCatalogLoading.value = true;
  const [postsResult, treesResult] = await Promise.allSettled([
    fetchPostList(),
    fetchTreeList("ALL"),
  ]);
  availablePosts.value =
    postsResult.status === "fulfilled" ? postsResult.value.posts || [] : [];
  availableTrees.value =
    treesResult.status === "fulfilled" ? treesResult.value || [] : [];
  contentCatalogLoading.value = false;
}

onMounted(async () => {
  document.addEventListener("click", handleDocumentClickForDropdowns, true);
  document.addEventListener("keydown", handleKeydownForDropdowns);
  void loadContentCatalog();
  await nextTick();
  try {
    const document = normalizeMindMapDocument(props.modelValue);
    syncEvolutionOptions(document);
    const instance = markRaw(
      new MindMap({
        el: mapContainer.value,
        data: document.root,
        layout: document.layout,
        theme: document.theme.template,
        themeConfig: document.theme.config,
        viewData: document.view || undefined,
        readonly: props.readOnly,
        fit: false,
        scaleRatio: 0.12,
        minZoomRatio: 20,
        maxZoomRatio: 300,
        mousewheelAction: "move",
        mousewheelZoomActionReverse: true,
        enableCtrlKeyNodeSelection: true,
        useLeftKeySelectionRightKeyDrag: !props.readOnly,
        enableShortcutOnlyWhenMouseInSvg: true,
        enableAutoEnterTextEditWhenKeydown: true,
        autoEmptyTextWhenKeydownEnterEdit: false,
        selectTextOnEnterEditText: true,
        createNewNodeBehavior: "default",
        defaultGeneralizationText: "概要注释",
        handleIsSplitByWrapOnPasteCreateNewNode: () => Promise.resolve(),
        maxHistoryCount: 300,
        fitPadding: 72,
        exportPaddingX: 48,
        exportPaddingY: 48,
        errorHandler: (_code, error) => console.error(error),
      }),
    );
    mindMap.value = instance;
    bindMindMapEvents(instance, Boolean(document.view));
    resizeObserver = new ResizeObserver(() => instance.resize());
    resizeObserver.observe(mapContainer.value);
    void stabilizeLayout(instance);
    emit("ready", instance);
    statusText.value = props.readOnly ? "只读浏览" : "准备就绪";
  } catch (error) {
    handleError(error, "进化树初始化失败");
  }
});

watch(
  () => props.readOnly,
  (value) => mindMap.value?.setMode(value ? "readonly" : "edit"),
);

watch(
  () => props.modelValue,
  (value) => {
    if (!mindMap.value) return;
    const serialized = JSON.stringify(value);
    if (serialized === lastPublished) {
      lastPublished = "";
      return;
    }
    try {
      const document = normalizeMindMapDocument(value);
      syncEvolutionOptions(document);
      mindMap.value.setFullData(document);
      layoutName.value = document.layout;
      nodeCount.value = countMindMapNodes(document.root);
    } catch (error) {
      handleError(error, "外部树数据更新失败");
    }
  },
);

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClickForDropdowns, true);
  document.removeEventListener("keydown", handleKeydownForDropdowns);
  window.clearTimeout(viewPublishTimer);
  window.clearTimeout(readOnlyFullRenderTimer);
  restoreEvolutionPresentation();
  resizeObserver?.disconnect();
  mindMap.value?.destroy();
  mindMap.value = null;
});

defineExpose({
  saveXur,
  exportFile,
  fitView,
  centerRoot,
  getDocument: currentDocument,
});
</script>

<style scoped>
.mind-map-workbench {
  --forest-950: #102d21;
  --forest-800: #1f5139;
  --forest-700: #286b49;
  --forest-100: #e6f0e9;
  --line: #d5dfd8;
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) 34px;
  width: 100%;
  height: 100%;
  min-height: 520px;
  overflow: hidden;
  background: #f8faf7;
  color: #24342b;
  font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
}

.command-bar {
  position: relative;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 54px;
  padding: 8px 12px;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.96);
  scrollbar-width: thin;
}

.command-group {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  padding-right: 8px;
  border-right: 1px solid var(--line);
}

.command-group:last-child {
  padding-right: 0;
  border-right: 0;
}

.command-bar button,
.inspector-actions button {
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid #cbd7cf;
  border-radius: 7px;
  background: #ffffff;
  color: #294236;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
}

.command-bar button:hover,
.inspector-actions button:hover {
  border-color: var(--forest-700);
  background: #f1f7f3;
  color: var(--forest-800);
}

.command-bar button.primary {
  border-color: var(--forest-700);
  background: var(--forest-700);
  color: #ffffff;
}

.command-bar button.danger {
  color: #a43b35;
}

.zoom-value {
  min-width: 58px;
  font-variant-numeric: tabular-nums;
}

.select-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #65746b;
}

.toggle-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 6px;
  color: #43584c;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.toggle-control input {
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: var(--forest-700);
  cursor: pointer;
}

.select-control select,
.field select,
.field input,
.field textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #cbd7cf;
  border-radius: 7px;
  background: #ffffff;
  color: #263a30;
  font: inherit;
}

.select-control select {
  width: auto;
  min-height: 34px;
  padding: 5px 28px 5px 8px;
}

.workspace-body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
}

.is-readonly .workspace-body {
  grid-template-columns: minmax(0, 1fr);
}

.mind-map-canvas {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.mind-map-canvas :deep(.evolution-readonly-text-link),
.mind-map-canvas :deep(.evolution-readonly-text-link .smm-text-node-wrap) {
  cursor: pointer;
}

.mind-map-canvas :deep(.evolution-article-text .smm-text-node-wrap) {
  fill: #0969da !important;
  text-decoration: underline;
}

/* 浮动工具栏：盖在画布上方而非挤占布局 */
.command-bar.floating {
  position: absolute;
  z-index: 12;
  top: 8px;
  left: 8px;
  right: 8px;
  max-height: 46vh;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 30px rgba(31, 59, 43, 0.14);
}

/* 收起/展开把手 */
.toolbar-toggle {
  position: absolute;
  z-index: 13;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 20px;
  padding: 0;
  border: 1px solid #cbd7cf;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #294236;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  box-shadow: 0 4px 14px rgba(31, 59, 43, 0.14);
}

.toolbar-toggle:hover {
  border-color: var(--forest-700);
  color: var(--forest-800);
}

.toolbar-toggle.top { top: 8px; }

.toolbar-toggle.bottom { bottom: 58px; }

.toolbar-toggle.bottom.collapsed { bottom: 8px; }

/* 选中节点的浮动快捷工具条 */
.node-quick-bar {
  position: absolute;
  z-index: 11;
  top: 64px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 24px);
  padding: 6px 10px;
  border: 1px solid #cbd7cf;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 30px rgba(31, 59, 43, 0.16);
  transform: translateX(-50%);
}

.quick-divider {
  flex: none;
  width: 1px;
  height: 18px;
  background: #d5dfd8;
}

.node-quick-bar :deep(.color-palette) {
  flex: none;
}

.node-quick-bar .quick-label {
  overflow: hidden;
  max-width: 220px;
  color: #52675e;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-quick-bar button {
  flex: none;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid #cbd7cf;
  border-radius: 999px;
  background: #fff;
  color: #294236;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  white-space: nowrap;
}

.node-quick-bar button:hover {
  border-color: var(--forest-700);
  background: #f1f7f3;
  color: var(--forest-800);
}

.node-quick-bar button.danger {
  color: #a43b35;
}

/* 顶部下拉菜单（布局 / 更多） */
.io-dropdown {
  position: relative;
}

/*
 * 工具栏本身是滚动容器（overflow:auto），会把绝对定位的浮层裁掉，
 * 导致菜单「点了没反应」。菜单展开期间临时解除裁剪。
 */
.command-bar.floating.menu-open {
  overflow: visible;
}

.io-dropdown-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 下拉菜单向下弹出（工具栏贴着工作区顶部，向上没有空间可放） */
.io-dropdown-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  bottom: auto;
  left: 0;
  display: grid;
  min-width: 218px;
  max-height: min(60vh, 420px);
  gap: 2px;
  padding: 6px;
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 36px rgba(31, 59, 43, 0.18);
  animation: popup-drop 0.16s ease;
}

@keyframes popup-drop {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.command-group:last-of-type .io-dropdown-menu,
.io-dropdown:last-child .io-dropdown-menu {
  right: 0;
  left: auto;
}

.io-dropdown.open .io-dropdown-btn {
  border-color: var(--forest-700);
  background: #e8f3ee;
  color: var(--forest-800);
}

.io-dropdown-menu button {
  min-height: 34px;
  text-align: left;
}

.io-dropdown-menu button.danger { color: #a43b35; }

.menu-group-label {
  padding: 6px 10px 2px;
  color: #91a097;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.menu-select {
  display: grid;
  gap: 4px;
  padding: 4px 10px 6px;
}

.menu-select span {
  color: #74847a;
  font-size: 11px;
}

.menu-select select {
  padding: 6px 8px;
  border: 1px solid #cbd7cf;
  border-radius: 7px;
  background: #fff;
  color: #263c33;
  font: inherit;
  font-size: 13px;
}

.menu-check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
}

.menu-check:hover { background: #f1f7f3; }

.menu-check input { accent-color: var(--forest-700); }

/* 浮动工具栏开关按钮 */
.floating-tools-toggle.active {
  border-color: var(--forest-700);
  background: #e8f3ee;
  color: var(--forest-800);
}

/* 底部悬浮建树工具栏 */
.build-bar {
  position: absolute;
  z-index: 11;
  bottom: 12px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 24px);
  padding: 6px 10px;
  border: 1px solid #cbd7cf;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 30px rgba(31, 59, 43, 0.16);
  transform: translateX(-50%);
}

.build-bar button {
  flex: none;
  min-height: 30px;
  padding: 4px 12px;
  border: 1px solid #cbd7cf;
  border-radius: 999px;
  background: #fff;
  color: #294236;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
}

.build-bar button:hover {
  border-color: var(--forest-700);
  background: #f1f7f3;
  color: var(--forest-800);
}

.build-bar button.danger { color: #a43b35; }

/* 属性面板：从浮动工具栏向上弹出的浮层（替代原右侧常驻侧边卡片） */
.inspector.popup {
  position: absolute;
  z-index: 12;
  top: 104px;
  right: 16px;
  width: min(320px, 88vw);
  max-height: min(62vh, 560px);
  min-width: 0;
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 44px rgba(31, 59, 43, 0.18);
}

.inspector-close {
  flex: none;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid #cbd7cf;
  border-radius: 50%;
  background: #fff;
  color: #52675e;
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  line-height: 1;
}

.inspector-close:hover {
  border-color: #2f806a;
  color: #2f806a;
}

.inspector.popup.disabled {
  display: none;
}

.inspector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
  border-bottom: 1px solid #e4ebe6;
}

.inspector-heading > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.inspector-heading strong {
  overflow: hidden;
  color: var(--forest-950);
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eyebrow {
  color: #74847a;
  font-size: 11px;
  letter-spacing: 0.12em;
}

.selection-badge {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: var(--forest-100);
  color: var(--forest-800);
  font-size: 12px;
  font-weight: 700;
}

.field {
  display: grid;
  gap: 6px;
  color: #5d6d63;
  font-size: 12px;
}

.full-field {
  margin: 14px 16px 0;
}

.name-actions {
  display: flex;
  margin: 8px 16px 0;
}

.node-citations-editor {
  display: grid;
  gap: 9px;
  margin: 14px 16px 0;
  padding: 12px;
  border: 1px solid #cfe0eb;
  border-radius: 9px;
  background: #f7fbfe;
}

.node-citations-heading > div {
  display: grid;
  gap: 3px;
}

.node-citations-heading strong {
  color: #244b66;
  font-size: 12px;
}

.node-citations-heading small {
  color: #6f8492;
  font-size: 11px;
  line-height: 1.45;
}

.node-citation-list {
  display: grid;
  gap: 6px;
}

.node-citation-list button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 7px;
  padding: 7px 8px;
  border: 1px solid #d4e2eb;
  border-radius: 7px;
  background: #fff;
  color: #425a69;
  text-align: left;
  cursor: pointer;
}

.node-citation-list sup {
  color: #1683d8;
  font-weight: 850;
}

.node-citation-list span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-citation-list i {
  color: #9b433d;
  font-style: normal;
}

.bind-citation-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
}

.bind-citation-row select,
.new-node-citation textarea {
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid #cbdbe5;
  border-radius: 7px;
  background: #fff;
  color: #334e60;
  font: inherit;
  font-size: 11px;
}

.bind-citation-row button,
.add-node-citation {
  padding: 6px 9px;
  border: 1px solid #1683d8;
  border-radius: 7px;
  background: #1683d8;
  color: #fff;
  font: inherit;
  font-size: 11px;
  font-weight: 750;
  cursor: pointer;
}

.bind-citation-row button:disabled,
.add-node-citation:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.new-node-citation {
  display: grid;
  gap: 5px;
  color: #587083;
  font-size: 11px;
}

.add-node-citation {
  justify-self: start;
}

.content-links-editor {
  display: grid;
  gap: 10px;
  margin: 14px 16px 0;
  padding: 12px;
  border: 1px solid #d8e2db;
  border-radius: 9px;
  background: #f8fbf9;
}

.content-links-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.content-links-heading > div {
  display: grid;
  gap: 3px;
}

.content-links-heading strong {
  color: #294236;
  font-size: 12px;
}

.content-links-heading small,
.content-links-empty,
.content-catalog-state {
  color: #74847a;
  font-size: 11px;
  line-height: 1.45;
}

.content-link-host {
  color: #0969da;
  overflow-wrap: anywhere;
}

.content-link-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
}

.content-link-actions button,
.remove-content-link {
  min-height: 30px;
  padding: 4px 9px;
  border: 1px solid #bfcfc4;
  border-radius: 7px;
  background: #fff;
  color: #285e44;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
}

.content-link-row {
  display: grid;
  gap: 7px;
  padding-top: 10px;
  border-top: 1px solid #e1e9e3;
}

.remove-content-link {
  justify-self: end;
  color: #9b433d;
}

.content-links-empty {
  margin: 0;
}

.content-link-error {
  color: #a44840;
}

.content-catalog-state {
  color: #587083;
}

.local-image-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin: 8px 16px 0;
}

.local-image-row button {
  min-height: 32px;
  padding: 5px 10px;
  border: 1px solid #286b49;
  border-radius: 7px;
  background: #f1f7f3;
  color: #1f5139;
  cursor: pointer;
}

.local-image-row small {
  color: #74847a;
  line-height: 1.35;
}

.node-image-preview {
  display: grid;
  gap: 6px;
  margin: 10px 16px 0;
  padding: 8px;
  border: 1px solid #d6e1da;
  border-radius: 9px;
  background: #fff;
  text-align: center;
}

.node-image-preview img {
  display: block;
  width: 100%;
  max-height: 220px;
  border-radius: 6px;
  background: #eef3f0;
  object-fit: contain;
}

.node-image-preview figcaption {
  color: #74847a;
  font-size: 11px;
  line-height: 1.4;
}

.name-actions button {
  min-height: 32px;
  padding: 5px 10px;
  border: 1px solid #cbd7cf;
  border-radius: 7px;
  background: #ffffff;
  color: #294236;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.name-actions button:hover:not(:disabled) {
  border-color: var(--forest-700);
  background: #f1f7f3;
}

.name-actions button:disabled {
  color: #8a978f;
  cursor: default;
  opacity: 0.72;
}

.field input,
.field select,
.field textarea {
  min-height: 36px;
  padding: 8px 9px;
  resize: vertical;
  outline: none;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--forest-700);
  box-shadow: 0 0 0 3px rgba(40, 107, 73, 0.1);
}

.color-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  margin: 15px 16px 0;
}

.inspector-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin: 16px;
}

.inspector-actions button {
  padding-inline: 4px;
  font-size: 12px;
}

.empty-inspector {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 70px 28px;
  color: #809087;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.empty-inspector p {
  margin: 0;
}

.empty-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 16px;
  background: var(--forest-100);
  color: var(--forest-700);
  font-size: 28px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 12px;
  overflow: hidden;
  border-top: 1px solid var(--line);
  background: #ffffff;
  color: #68786e;
  font-size: 11px;
  white-space: nowrap;
}

.status-bar span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34a26a;
  box-shadow: 0 0 0 3px rgba(52, 162, 106, 0.12);
}

.shortcut-hint {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.engine-mark {
  margin-left: auto;
  color: #91a097;
}

@media (max-width: 920px) {
  .command-bar.floating {
    top: 34px;
    left: 6px;
    right: 6px;
  }

  .toolbar-toggle {
    top: 6px;
  }

  .inspector.popup {
    top: auto;
    right: 6px;
    bottom: 96px;
    width: min(286px, calc(100% - 12px));
    max-height: 52vh;
  }

  .node-quick-bar {
    bottom: 40px;
    max-width: calc(100% - 12px);
  }

  .node-quick-bar .quick-label {
    max-width: 120px;
  }

  .shortcut-hint,
  .engine-mark {
    display: none !important;
  }
}
</style>
