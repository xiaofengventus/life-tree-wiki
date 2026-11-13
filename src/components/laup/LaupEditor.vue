<script setup>
// Laup 编辑器的 Vue 承载层。
//
// ── 这一层只做三件事
//   ① 把 Laup 的 DOM 骨架渲染出来（模板就是上游 index.html 的 body，去掉宿主那部分）
//   ② 把样式挂上（laup.css，编辑与阅读共用同一份 —— 这是"同一视角"的载体）
//   ③ 把编辑器内核挂到根上、卸载时收干净，并把源码变化抛给父组件
//
// 内核本身在 @/laup/editor/LaupEditorCore.js —— 它不依赖 Vue，
// 所以同一台编辑器既能用在站内，也能（将来）用在别处。
//
// ⚠️ `#doc` 里的内容由内核用命令式 DOM 管理，Vue **不能碰**：
//   模板里它是个空元素（无子节点），Vue patch 时不会去动它的真实子节点。
//   所以这一层绝不要在 `#doc` 上挂 v-if / v-show / v-for 之类。
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import katex from "katex";
import "katex/dist/katex.min.css";
import "@/laup/laup.css";
import { createLaupEditor } from "@/laup/editor/LaupEditorCore.js";

const props = defineProps({
  /** 初始源码。**只在挂载时用** —— 之后要整篇替换请调 setSource()，
   *  否则会和用户正在敲的字打架（光标被顶掉）。 */
  initialSource: { type: String, default: "" },
});
const emit = defineEmits(["change", "ready"]);

const hostEl = ref(null);
const editor = shallowRef(null);

// 「写代码」的两个入口：导入 Laup 源码 / 导入 Markdown。
// 日常编辑是可视化的（不写代码），源码只从这两个口子进来。
const importMode = ref("");
const importText = ref("");

const importHint = () =>
  importMode.value === "md"
    ? "Laup 是 Markdown 的超集 —— md 写法直接可用"
    : "粘贴一份 Laup 源码；表格 / 公式这类块会照 Laup 的规则渲染";
const importPlaceholder = () =>
  importMode.value === "md" ? "# 标题\n\n正文，**加粗**、`代码`、$x^2$…" : "# 标题\n\n\\table=[\n    column=[\n        \"内容\"\n    ]\n]";

onMounted(() => {
  editor.value = createLaupEditor({
    root: hostEl.value,
    // ⚠️ 有源码时才传 initialSource。**传空串会顶掉内核的默认值**（LaupEditorCore 的签名是
    //    `initialSource = STARTER_SRC`）—— 而这个 prop 的默认值正是 ""，于是每次挂载都
    //    把骨架顶掉了。表现：打开 /laup 正文区**一个块都没有**，连「点这里开始写」的占位
    //    都看不见，用户没地方点击、也就没法开始写（看着就像"只有样式没有交互"）。
    //    草稿与「编辑既有文章」都是挂载之后用 setSource() 灌进来的，所以这里为空才是常态。
    ...(props.initialSource ? { initialSource: props.initialSource } : {}),
    katex,
    onChange: (src) => emit("change", src),
  }).mount();
  emit("ready", editor.value);
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  editor.value = null;
});

function applyImport(mode) {
  const src = importText.value;
  if (!src.trim() || !editor.value) return;
  const current = editor.value.getSource() || "";
  const next = mode === "append" && current.trim()
    ? `${current.replace(/\s+$/, "")}\n\n${src}`
    : src;
  editor.value.setSource(next);
  importMode.value = "";
  importText.value = "";
  emit("change", next);
}

defineExpose({
  getSource: () => editor.value?.getSource() ?? "",
  setSource: (src) => editor.value?.setSource(src),
});
</script>

<template>
  <div ref="hostEl" class="laup-app">
    <!-- 顶栏只剩工具栏一条。原来那条「品牌 + 提示语 + N 块统计 + 看整篇渲染结果」已删：
         本站有导航栏，那一行里的品牌与提示都是重复的，块数统计也只在开发时有用
         （诊断信息仍由下面的 .warnings 给）。预览按钮并进工具栏右端，功能不丢。

         ⚠️ 这条工具栏是**固定在导航栏下面**的。形态写在文件末尾的 scoped 样式里 ——
         它属于「宿主外壳」（本站有 64px 的导航栏，Laup 上游的独立页没有），
         所以刻意不写进 laup.css：那个文件是 scripts/extract-laup-css.mjs 从上游抽的生成物。

         ⚠️ `#stats` 元素已删：内核 paintStats() 里有 `if (!els.stats) return` 兜底，
         删掉不会抛错。 -->
    <div class="chrome">
      <div class="toolbar" id="toolbar">
        <!-- 格式组（标题级别 / 粗细 / 字号 / 颜色 / 列表 / 引用 / 链接）由内核按
             editor/formatSpec.js 建出来，插到这个锚点之前，建完把锚点删掉 ——
             留着它会打断 `.tb-group + .tb-group` 那条画竖线的相邻选择器。 -->
        <span id="tb-fmt-anchor"></span>
        <div class="tb-group">
          <button class="tb-btn" type="button" data-ins="table" title="插入表格骨架">表格</button>
          <button class="tb-btn" type="button" data-ins="image" title="插入图片骨架">图片</button>
          <button class="tb-btn" type="button" data-ins="tree" title="插入进化树引用">进化树</button>
          <button class="tb-btn" type="button" data-ins="sample" title="插入代码案例">案例</button>
          <button class="tb-btn" type="button" data-ins="references" title="插入参考文献列表">文献</button>
          <button class="tb-btn" type="button" data-ins="cite" title="插入正文引用锚点">文内引用</button>
        </div>
        <div class="tb-group">
          <button class="tb-btn" type="button" @click="importMode = 'laup'" title="把一份 Laup 源码整篇导入">导入 Laup</button>
          <button class="tb-btn" type="button" @click="importMode = 'md'" title="把一份 Markdown 整篇导入">导入 MD</button>
        </div>
        <div class="tb-group tb-right">
          <!-- 整篇渲染结果：原来在顶栏那一行，现在并进工具栏右端。
               ⚠️ id 必须保持 `btn-render` —— 内核按这个 id 绑点击（bindEvents 里那句
               `if (els.btnRender)`），换 id 就等于悄悄废掉这个功能。 -->
          <button
            class="tb-btn"
            type="button"
            id="btn-render"
            title="看整篇渲染结果 —— 与发布出来的是同一个渲染函数"
          >预览</button>
          <button class="tb-btn" type="button" data-act="undo" id="btn-undo" title="撤销（Ctrl+Z）">↶</button>
          <button class="tb-btn" type="button" data-act="redo" id="btn-redo" title="重做（Ctrl+Shift+Z / Ctrl+Y）">↷</button>
        </div>
        <span class="tb-tip" id="tb-tip" hidden>先把光标放到某一块里，再用工具栏</span>
      </div>
    </div>

    <main class="doc" id="doc"></main>
    <footer class="warnings" id="warnings"></footer>

    <div class="overlay" id="overlay" hidden>
      <header class="bar">
        <span class="brand">整篇渲染结果</span>
        <span class="hint">这是最终发布出来的样子，与编辑器用的是同一个渲染函数</span>
        <button class="btn" id="btn-close" type="button">关闭</button>
      </header>
      <div class="doc" id="overlay-doc"></div>
    </div>

    <!-- 块外观调参：只改 CSS 变量，一个字的正文都不动 -->
    <button class="tune-fab" id="tune-fab" type="button" title="块外观调参">◐</button>
    <div class="tune-panel" id="tune-panel" hidden>
      <div class="tune-title">块外观</div>
      <div class="tune-row">
        <label for="tune-mark">悬停标记</label>
        <select id="tune-mark">
          <option value="bar">左侧色条</option>
          <option value="outline">整块边框</option>
          <option value="none">不画</option>
        </select>
      </div>
      <div class="tune-row">
        <label for="tune-bar">标记颜色</label>
        <input type="color" id="tune-bar" />
      </div>
      <div class="tune-row">
        <label for="tune-bg">悬停底色</label>
        <input type="color" id="tune-bg" />
      </div>
      <div class="tune-row">
        <label for="tune-boundary">块间分隔线</label>
        <select id="tune-boundary">
          <option value="0 none">无（安静）</option>
          <option value="1px dashed #eef0f2">淡虚线</option>
          <option value="1px solid #e4e7eb">实线</option>
        </select>
      </div>
      <div class="tune-row">
        <label for="tune-gutter">图标栏位置</label>
        <select id="tune-gutter">
          <option value="left">左侧留白</option>
          <option value="right">右侧留白</option>
        </select>
      </div>
      <div class="tune-foot">
        <button class="tune-btn" id="tune-copy" type="button">复制为 CSS</button>
        <button class="tune-btn" id="tune-reset" type="button">还原</button>
      </div>
      <div class="tune-note">只改这几条 CSS 变量；文档内容一个字都不动。</div>
    </div>

    <!-- 写代码的两个入口（日常编辑不用碰源码） -->
    <div v-if="importMode" class="overlay">
      <header class="bar">
        <span class="brand">{{ importMode === "md" ? "导入 Markdown" : "导入 Laup 源码" }}</span>
        <span class="hint">{{ importHint() }}</span>
        <button class="btn" type="button" @click="importMode = ''">关闭</button>
      </header>
      <div class="host-body">
        <p class="host-note">
          <button class="btn btn-go" type="button" @click="applyImport('replace')">替换整篇</button>
          <button class="btn" type="button" @click="applyImport('append')">追加到末尾</button>
        </p>
        <textarea
          v-model="importText"
          class="import-src"
          rows="14"
          spellcheck="false"
          :placeholder="importPlaceholder()"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── 宿主外壳（只有「嵌进本站」才存在的形态，所以写在这里，而不是生成的 laup.css）
   站点的导航栏（.wiki-header）占着最上面 64px，Laup 上游那个独立页没有它 ——
   于是工具栏从「自己的吸顶条」变成「导航栏下面的一条固定栏」，
   形态照 /create-post 的 .editor-toolbar-fixed。 */

/* ⚠️ z-index 必须**高于**浮动工具栏（laup.css 里 .fbar 是 24）。
   .chrome 自己是一个层叠上下文，里面的下拉 / 取色器都出不了这个盒子 ——
   一旦低于 .fbar，选区靠近文稿顶部时浮动工具栏正好压在取色器下拉上，色块就点不到了。
   （这是真鼠标探针发现的，合成事件测不出来。） */
.chrome {
  position: fixed;                /* 覆盖 laup.css 里的 position: sticky; top: 64px */
  top: 64px;                      /* = 导航栏高度。.wiki-header 是 min-height:64px，窄屏断点下也只改宽度和字号 */
  left: 0;
  right: 0;
  z-index: 30;
  background: #fff;               /* 原来自带半透明 + backdrop-filter，那是给吸顶条用的，固定栏不需要 */
  backdrop-filter: none;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .06);
}

/* ⚠️ 浮层必须盖在站点导航栏（.wiki-header，z-index 50）**之上**。
   laup.css 里 `.overlay` 是 40 —— 那是给 Laup 独立页定的，那边没有导航栏。
   到了本站，浮层是全屏的（inset: 0），40 的时候它顶部那条带「关闭」按钮的 header
   正好被吸顶导航栏压住：鼠标点上去落在导航栏上，浮层一动不动 →
   「看整篇渲染结果」打开后就再也关不掉，只能刷新页面。 */
.overlay { z-index: 60; }

/* ⚠️ 刻意**不**加 overflow-x 做横向滚动：格式组的色板 / 字号下拉是绝对定位在
   .tb-fmt-wrap 里的，滚动容器会把它们整个裁掉（/create-post 那边为此写了一整套
   is-panel-open + scrollLeft 补偿）。窄屏就让工具栏折行 —— 它变高以后由内核的
   ResizeObserver 实测写回 --laup-chrome-h，锚点偏移自动跟着走，不用改代码。 */
.toolbar { padding: 6px 22px; }

/* 首帧兜底：内核量完之前先用这个值。= 导航栏 64 + 工具栏一条的高度。
   （laup.css 里的 104px 是旧的「顶栏 + 工具栏」两行时代的值。） */
.laup-app { --laup-chrome-h: 120px; }

/* 正文末尾不再留 120px —— 正文现在住在一张表单白卡里，下面紧跟着作者 / 标签 / 提交声明，
   那 120px 会变成卡片中间一段莫名其妙的空白。 */
#doc { padding-bottom: 16px; }
</style>
