<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import ContentSourcesDisplay from "@/components/ContentSourcesDisplay.vue";
import ResearchTreeEmbed from "@/components/ResearchTreeEmbed.vue";
import PostClassificationCard from "@/components/PostClassificationCard.vue";
import ContentInteractions from "@/components/ContentInteractions.vue";
import { deletePost, fetchPost, fetchPostByTitle, updatePostVisibility } from "@/services/posts";
import { parsePostBlocks } from "@/utils/postBlocks";
import { normalizePostCard } from "@/utils/wangEditorPostCard";
import { formatDateTime } from "@/utils/date";
import { useUserStore } from "@/stores/user";
import katex from "katex";
import "katex/dist/katex.min.css";
// laup-math 手机友好语法 → LaTeX（失败回退原文，纯 LaTeX 文章零损耗）
import { translate } from "@/utils/mathKit";
import { highlightLaupCode } from "@/utils/codeLang";
// Notebook 阅读视图：contentSource 在客户端按编辑器同一条管线渲染（不经过服务端重渲）
import { renderNotebookDoc } from "@/notebook/renderer.js";
// Laup 阅读面样式（文献列表 / 引用上标 / 图示 / sample 围栏…全部 .doc 作用域）。
// 以前只有旧编辑器的实时预览引入了它，文章详情页的服务端渲染产物全是裸 HTML。
import "@/laup/laup.css";
import { articleTemplateLabel } from "../../shared/articleTemplates.js";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const post = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const deleting = ref(false);

// 讨论区：右下角圆形悬浮按钮打开的侧栏小卡片（与 life-tree.vue 同款）
const commentsPanelOpen = ref(false);

// 作者本人可编辑；作者或站点所有者可删除（与 view_post 的判定一致）
const isCreator = computed(() => {
  if (!post.value || !userStore.user) return false;
  if (post.value.creatorUid && userStore.user.uid) {
    return post.value.creatorUid === userStore.user.uid;
  }
  return post.value.creator === userStore.user.name;
});
const canDelete = computed(() => isCreator.value || userStore.isSiteOwner);

function updatePost() {
  if (!isCreator.value || !post.value) return;
  // 有文章模板的 Laup 文档回原 Laup 写作页；通用 Notebook 保持原入口。
  if (post.value.contentType === "laup") {
    router.push({ path: post.value.articleTemplate ? "/laup" : "/notebook", query: { edit: post.value.id } });
    return;
  }
  router.push(`/create-post?edit=${encodeURIComponent(post.value.id)}`);
}

async function removePost() {
  if (!canDelete.value || !post.value || deleting.value) return;
  const confirmed = window.confirm(
    `确定删除文章“${post.value.title}”吗？\n\n文章 UID ${post.value.uid || ""} 会永久保留，删除后仅站点所有者可见。`,
  );
  if (!confirmed) return;
  deleting.value = true;
  try {
    await deletePost(post.value.id);
    await router.push("/columns");
  } catch (error) {
    window.alert(`删除文章失败：${error.message || "未知错误"}`);
  } finally {
    deleting.value = false;
  }
}

// 只切可见性，不动内容：公开 ⇄ 仅自己可见（2026-10-12 起双向放开，私密无槽位上限）
const visibilityBusy = ref(false);
async function toggleVisibility() {
  if (!isCreator.value || !post.value || visibilityBusy.value) return;
  const toPrivate = post.value.visibility !== "PRIVATE";
  const confirmed = window.confirm(
    toPrivate
      ? "把这篇文章设为仅自己可见吗？\n\n公开镜像会立即撤下（专栏、搜索里消失），随时可以再转回公开。"
      : "把这篇文章转为公开吗？",
  );
  if (!confirmed) return;
  visibilityBusy.value = true;
  try {
    post.value = await updatePostVisibility(
      post.value.id,
      toPrivate ? "PRIVATE" : "PUBLIC",
    );
  } catch (error) {
    window.alert(`修改可见范围失败：${error.message || "未知错误"}`);
  } finally {
    visibilityBusy.value = false;
  }
}

const sourceBlocks = computed(() => parsePostBlocks(post.value?.content || "", {
  citations: post.value?.citations || [],
}));

// ── Laup 文章双视图 ─────────────────────────────────────────────────
//   notebook = 客户端拿 contentSource 按 Notebook 编辑器同一条管线渲染
//              （src/notebook/renderer.js 的 renderNotebookDoc），
//              编辑器里看到的排版 / 公式 / 对照卡什么样，阅读页就什么样；
//   article  = 服务端发布时入库的 HTML（原有视图，保留作对照与兜底）。
// 默认 notebook；只有 Laup 文章（接口已带 contentSource）显示切换。
const readView = ref("notebook");
const isLaupPost = computed(() =>
  post.value?.contentType === "laup" && Boolean(post.value.contentSource),
);
const notebookHtml = computed(() => {
  if (!isLaupPost.value || readView.value !== "notebook") return "";
  return renderNotebookDoc(post.value.contentSource);
});

// html 块 → 目录（h1~h3 编号锚点）+ 代码上色。Notebook 视图与服务端视图共用同一份。
function decorateHtmlBlocks(blocks) {
  let sectionIndex = 0;
  const outline = [];
  const out = blocks.map((block) => {
    if (block.type !== "html" || typeof DOMParser === "undefined") return block;
    const parsed = new DOMParser().parseFromString(`<body>${block.html}</body>`, "text/html");
    parsed.body.querySelectorAll("h1, h2, h3").forEach((heading) => {
      const text = heading.textContent?.trim();
      if (!text) return;
      const id = `section-${sectionIndex}`;
      sectionIndex += 1;
      heading.id = id;
      outline.push({ id, text, level: Number(heading.tagName.slice(1)) });
    });
    return { ...block, html: highlightLaupCode(parsed.body.innerHTML) };
  });
  return { blocks: out, outline };
}

const article = computed(() => {
  // Notebook 视图：整篇渲染成一个 html 块（目录 / 标题样式照常生效）；
  // 渲染为空（空文档 / 异常）时自动回退到服务端入库 HTML
  if (notebookHtml.value) {
    return decorateHtmlBlocks([{ type: "html", id: "notebook", html: notebookHtml.value }]);
  }
  return decorateHtmlBlocks(sourceBlocks.value);
});

const cardsById = computed(() => Object.fromEntries(
  (post.value?.classificationCards || []).map((card) => [card.id, card]),
));

const POST_TYPE_LABELS = { news: "新闻", science: "科普" };
const typeLabel = computed(() => POST_TYPE_LABELS[post.value?.type] || "未分类");

// ── 协作：贡献者 / 历史版本 / diff 对比 / 回滚 ────────────────────────────
// 「条目 | 阅读 | 历史」三个 tab，Wikipedia 式切换；历史页替换正文区展示
const activeTab = ref("article");

// 贡献者 = 历史版本里出现过的所有编辑人（含创建者），按修订次数排序
const contributors = computed(() => {
  const byUid = new Map();
  for (const revision of post.value?.history || []) {
    const key = revision.editorUid || revision.editor || "匿名";
    const existing = byUid.get(key);
    if (existing) existing.count += 1;
    else {
      byUid.set(key, {
        key,
        name: revision.editor || "匿名",
        uid: revision.editorUid || "",
        avatarUrl: revision.editorAvatarUrl || "",
        count: 1,
      });
    }
  }
  return [...byUid.values()].sort((a, b) => b.count - a.count);
});

const revisionsDesc = computed(() =>
  [...(post.value?.history || [])].sort((a, b) => b.revisionCount - a.revisionCount),
);

// 对比哪两版：默认「上一版 → 当前版本」（历史最新一条 vs 倒数第二条）。
// 存修订号，比较时再解析成快照。
const diffBase = ref(null);
const diffTarget = ref(null);
const diffLoading = ref(false);
const diffError = ref("");
const diffRows = ref(null);
const diffMeta = ref(null); // { base, target } 快照元信息（标题/编辑人/时间）
const rollingBack = ref(false);

function openHistory() {
  activeTab.value = "history";
  const list = revisionsDesc.value;
  if (list.length === 0) return;
  diffBase.value = list.length > 1 ? list[1].revisionCount : null;
  diffTarget.value = list[0].revisionCount;
  void compareByNumber(diffBase.value, diffTarget.value);
}

function revisionByNumber(revisionNumber) {
  return (post.value?.history || []).find((r) => r.revisionCount === revisionNumber) || null;
}

async function compareByNumber(baseNumber, targetNumber) {
  if (!post.value || !targetNumber) return;
  diffError.value = "";
  diffLoading.value = true;
  diffRows.value = null;
  diffMeta.value = null;
  try {
    const targetRevision = revisionByNumber(targetNumber);
    if (!targetRevision) throw new Error("版本不存在");
    const baseRevision = baseNumber ? revisionByNumber(baseNumber) : null;
    const [targetSnapshot, baseSnapshot] = await Promise.all([
      fetchPostRevision(post.value.id, targetRevision.revisionCount),
      baseRevision ? fetchPostRevision(post.value.id, baseRevision.revisionCount) : Promise.resolve(null),
    ]);
    diffBase.value = baseNumber;
    diffTarget.value = targetNumber;
    diffMeta.value = { base: baseSnapshot, target: targetSnapshot };
    diffRows.value = collapseSame(
      diffLines(baseSnapshot ? snapshotText(baseSnapshot) : "", snapshotText(targetSnapshot)),
    );
  } catch (error) {
    diffError.value = error.message || "版本内容加载失败";
  } finally {
    diffLoading.value = false;
  }
}

// 恢复某版内容：以「新修订」提交（旧历史永不丢失），复用乐观锁 updatePost
async function rollbackTo(revision) {
  if (!isCreator.value || rollingBack.value) return;
  const confirmed = window.confirm(
    `确定恢复到 r${revision.revisionCount}（${revision.editor || "未知编辑人"} · ${formatDateTime(revision.submittedAt)}）吗？\n\n当前内容会作为一次新的修订保留在历史里，不会丢失。`,
  );
  if (!confirmed) return;
  rollingBack.value = true;
  diffError.value = "";
  try {
    const snapshot = await fetchPostRevision(post.value.id, revision.revisionCount);
    await updatePost(post.value.id, {
      version: post.value.version,
      title: post.value.title,
      author: post.value.author || undefined,
      content: snapshot.contentType === "laup" ? snapshot.contentSource : snapshot.content,
      contentFormat: snapshot.contentType === "laup" ? "laup" : "html",
      articleTemplate: snapshot.articleTemplate,
      tags: post.value.tags || [],
      type: post.value.type || "",
      license: post.value.license || "支持闭源",
      visibility: post.value.visibility || "PUBLIC",
      citations: snapshot.citations || [],
      classificationCards: snapshot.classificationCards || [],
      changeNote: `回滚到 r${revision.revisionCount}`,
    });
    window.alert(`已恢复到 r${revision.revisionCount}，本次恢复记为一次新修订。`);
    await loadPost();
    activeTab.value = "article";
  } catch (error) {
    diffError.value = error.message || "回滚失败";
  } finally {
    rollingBack.value = false;
  }
}

function cardFor(block) {
  const stored = cardsById.value[block.id];
  if (stored) return stored;
  if (!block.config) return null;
  try {
    return normalizePostCard({ ...JSON.parse(decodeURIComponent(block.config)), id: block.id });
  } catch {
    // config 损坏时仍渲染基础卡片结构，避免整卡消失
    return normalizePostCard({ id: block.id, title: "卡片内容无法解析" });
  }
}

async function loadPost() {
  loading.value = true;
  errorMessage.value = "";
  post.value = null;
  commentsPanelOpen.value = false;
  activeTab.value = "article";
  try {
    post.value = route.name === "wiki-post"
      ? await fetchPostByTitle(route.params.title)
      : await fetchPost(route.params.id);
  } catch (error) {
    errorMessage.value = error.message || "文章加载失败";
  } finally {
    loading.value = false;
  }
}

// 只关注路由参数：点击页内锚点（#section-3 / #post-citation-1）只改变 hash，
// 不应触发文章重新加载（否则滚动位置被重置，表现为"跳转失灵要点多次"）
watch(
  () => [route.name, route.params.title, route.params.id],
  loadPost,
  { immediate: true },
);

// 文章正文里的公式：服务端只产出 <span data-tex="…"> 原文，
// 排版在阅读页完成 —— 先过 mathKit（laup-math 语法），再交 KaTeX
const articleEl = ref(null);
function renderMath() {
  if (!articleEl.value) return;
  for (const el of articleEl.value.querySelectorAll("[data-tex]")) {
    if (el.dataset.texDone) continue;
    try {
      katex.render(translate(el.dataset.tex) ?? el.dataset.tex, el, {
        throwOnError: false,
        displayMode: el.classList.contains("laup-math-display"),
      });
      el.dataset.texDone = "1";
    } catch { /* 非法公式保留原文 */ }
  }
}
watch(() => [article.value, activeTab.value], () => nextTick(renderMath), { immediate: true, flush: "post" });

// 页内锚点统一平滑滚动（目录、正文引用标记、参考文献回链），
// 不走 vue-router 导航，也就不会触发任何请求
function handleAnchorClick(event) {
  const anchor = event.target.closest?.('a[href^="#"]');
  if (!anchor) return;
  const sectionId = anchor.getAttribute("href").slice(1);
  if (!sectionId) return;
  const target = document.getElementById(sectionId);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  const hash = `#${sectionId}`;
  if (window.location.hash !== hash) {
    history.replaceState(history.state, "", hash);
  }
}
</script>

<template>
  <navBar />
  <main class="article-page" @click="handleAnchorClick">
    <p v-if="loading" class="state">正在加载文章...</p>
    <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>
    <div v-else-if="post" class="article-layout">
      <aside class="outline" aria-label="目录">
        <strong>目录</strong>
        <a
          v-for="item in article.outline"
          :key="item.id"
          :class="`level-${item.level}`"
          :href="`#${item.id}`"
        >
          {{ item.text }}
        </a>
      </aside>

      <article class="article-paper">
        <header class="article-header">
          <h1>{{ post.title || "未命名文章" }}</h1>
          <div class="article-tabs">
            <span>条目</span><span>阅读</span>
            <template v-if="isCreator || canDelete">
              <span class="tabs-separator" aria-hidden="true">|</span>
              <button v-if="isCreator" type="button" class="tab-action" @click="updatePost">编辑</button>
              <button
                v-if="canDelete"
                type="button"
                class="tab-action danger"
                :disabled="deleting"
                @click="removePost"
              >
                {{ deleting ? "删除中…" : "删除" }}
              </button>
            </template>
            <div v-if="isLaupPost" class="view-toggle" role="group" aria-label="正文渲染视图">
              <button
                type="button"
                :class="{ on: readView === 'notebook' }"
                @click="readView = 'notebook'"
              >Notebook 视图</button>
              <button
                type="button"
                :class="{ on: readView === 'article' }"
                @click="readView = 'article'"
              >文章视图</button>
            </div>
          </div>
          <p>{{ post.author || post.creator || "未署名" }} · {{ formatDateTime(post.updatedAt || post.submittedAt) }}</p>
          <p v-if="post.articleTemplate">写作模板：{{ articleTemplateLabel(post.articleTemplate) }}（章节可按内容调整）</p>
        </header>

        <section v-if="activeTab === 'article'" ref="articleEl" class="article-content">
          <template v-for="(block, index) in article.blocks" :key="`${block.type}-${block.id || index}`">
            <div v-if="block.type === 'html'" class="laup-doc doc laup-post-html" v-html="block.html"></div>
            <ResearchTreeEmbed v-else-if="block.type === 'tree'" :tree-id="block.id" :fallback-title="block.title" />
            <PostClassificationCard v-else-if="block.type === 'card' && cardFor(block)" :card="cardFor(block)" />
          </template>
        </section>
        <ContentSourcesDisplay v-if="activeTab === 'article'" :citations="post.citations" />

        <!-- 历史版本：修订列表 + 任选两版红绿对比 + （创建者）一键回滚 -->
        <section v-else class="history-panel">
          <p v-if="!revisionsDesc.length" class="state-inline">这篇文章还没有历史版本。</p>
          <template v-else>
            <div class="diff-picker">
              <label>对比
                <select v-model.number="diffBaseRef">
                  <option :value="null" disabled>（初始）</option>
                  <option v-for="r in revisionsDesc" :key="'b' + r.revisionCount" :value="r.revisionCount">r{{ r.revisionCount }}</option>
                </select>
              </label>
              <span>→</span>
              <label>
                <select v-model.number="diffTargetRef">
                  <option v-for="r in revisionsDesc" :key="'t' + r.revisionCount" :value="r.revisionCount">r{{ r.revisionCount }}</option>
                </select>
              </label>
              <button type="button" class="tab-action" :disabled="diffLoading" @click="compareByNumber(diffBaseRef, diffTargetRef)">
                {{ diffLoading ? "加载中…" : "比较" }}
              </button>
              <small v-if="diffMeta?.target" class="diff-meta">
                r{{ diffMeta.target.revisionCount }} · {{ diffMeta.target.editor || "未知编辑人" }} · {{ formatDateTime(diffMeta.target.submittedAt) }} · {{ diffMeta.target.changeNote || "无提交说明" }}
              </small>
            </div>

            <p v-if="diffError" class="state-inline error">{{ diffError }}</p>

            <div v-if="diffRows" class="diff-view" role="table" aria-label="版本差异对比">
              <template v-for="(row, index) in diffRows" :key="index">
                <div v-if="row.type === 'skip'" class="diff-skip">{{ row.text }}</div>
                <div v-else :class="`diff-line diff-${row.type}`" :data-type="row.type">
                  <span class="diff-gutter">{{ row.type === 'add' ? '+' : row.type === 'del' ? '−' : '' }}</span>
                  <span class="diff-text">{{ row.text || ' ' }}</span>
                </div>
              </template>
            </div>

            <ul class="revision-list">
              <li v-for="r in revisionsDesc" :key="r.revisionCount">
                <span class="rev-no">r{{ r.revisionCount }}</span>
                <img v-if="r.editorAvatarUrl" class="rev-avatar" :src="r.editorAvatarUrl" :alt="r.editor" />
                <span class="rev-editor">{{ r.editor || "匿名" }}</span>
                <time>{{ formatDateTime(r.submittedAt) }}</time>
                <span class="rev-note">{{ r.note || "" }}</span>
                <span v-if="r.articleTemplate">{{ articleTemplateLabel(r.articleTemplate) }}</span>
                <span class="rev-actions">
                  <button
                    v-if="r.revisionCount > 1"
                    type="button"
                    class="tab-action"
                    @click="compareByNumber(r.revisionCount - 1, r.revisionCount)"
                  >与上一版对比</button>
                  <button
                    v-if="isCreator"
                    type="button"
                    class="tab-action"
                    :disabled="rollingBack"
                    @click="rollbackTo(r)"
                  >恢复此版本</button>
                </span>
              </li>
            </ul>
          </template>
        </section>
      </article>

      <aside class="infobox" aria-label="文章信息">
        <div class="infobox-heading">{{ post.title || "文章" }}</div>
        <img v-if="post.coverUrl" :src="post.coverUrl" :alt="post.title" />
        <dl>
          <div><dt>类型</dt><dd>{{ typeLabel }}</dd></div>
          <div>
            <dt>可见范围</dt>
            <dd>
              {{ post.visibility === "PRIVATE" ? "仅自己可见" : "公开" }}
              <button
                v-if="isCreator"
                type="button"
                class="tab-action"
                style="margin-left: 6px"
                :disabled="visibilityBusy"
                @click="toggleVisibility"
              >{{ visibilityBusy ? "处理中…" : post.visibility === "PRIVATE" ? "改为公开" : "改为私有" }}</button>
            </dd>
          </div>
          <div><dt>作者</dt><dd>{{ post.author || post.creator || "未署名" }}</dd></div>
          <div><dt>发布时间</dt><dd>{{ formatDateTime(post.submittedAt) }}</dd></div>
          <div v-if="post.tags?.length"><dt>标签</dt><dd>{{ post.tags.join("、") }}</dd></div>
          <div><dt>许可</dt><dd>{{ post.license || "未说明" }}</dd></div>
          <div v-if="contributors.length > 1">
            <dt>贡献者</dt>
            <dd>
              <span v-for="c in contributors" :key="c.key" class="contributor">
                <img v-if="c.avatarUrl" :src="c.avatarUrl" :alt="c.name" />
                <span>{{ c.name }}</span><small>×{{ c.count }}</small>
              </span>
            </dd>
          </div>
        </dl>
      </aside>
    </div>
    <p v-else class="state">文章不存在。</p>

    <!-- 讨论区：右下角圆形悬浮按钮 + 侧栏小卡片（与 life-tree.vue 同款） -->
    <template v-if="post">
      <div class="float-actions">
        <button
          type="button"
          class="float-button"
          :class="{ active: commentsPanelOpen }"
          aria-label="讨论区"
          title="讨论区"
          @click="commentsPanelOpen = !commentsPanelOpen"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M4 4h16a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 20 17h-9.6L6 20.7a.9.9 0 0 1-1.5-.7V17H4a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 4 4z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <transition name="panel-slide">
        <aside v-if="commentsPanelOpen" class="comments-side-panel" aria-label="文章讨论区">
          <header class="panel-heading">
            <div>
              <span>DISCUSSION</span>
              <strong>{{ post.title || "未命名文章" }}</strong>
            </div>
            <button type="button" aria-label="关闭讨论区" @click="commentsPanelOpen = false">关闭</button>
          </header>
          <div class="panel-body comments-body">
            <ContentInteractions :content-id="post.uid || post.id" type="post" />
          </div>
        </aside>
      </transition>
    </template>
  </main>
</template>

<style scoped>
.article-page { min-height: calc(100vh - 65px); padding: 42px 32px 90px; background: #fff; }
.article-layout { display: grid; width: min(100%, 1400px); margin: 0 auto; grid-template-columns: 180px minmax(0, 780px) 250px; gap: 34px; align-items: start; }
.outline { position: sticky; top: 86px; max-height: calc(100vh - 110px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; display: grid; gap: 7px; padding-top: 12px; border-top: 1px solid #a2a9b1; }
.outline strong { margin-bottom: 7px; color: #202122; font-size: 14px; }
.outline a { color: #3366cc; font-size: 13px; line-height: 1.4; text-decoration: none; }
.outline a:hover { text-decoration: underline; }
.outline .level-2 { padding-left: 12px; }.outline .level-3 { padding-left: 24px; }
.article-paper { min-width: 0; color: #202122; }
.article-header { border-bottom: 1px solid #a2a9b1; }
.article-header h1 { margin: 0; color: #202122; font-family: Georgia, "Noto Serif SC", "Songti SC", serif; font-size: clamp(30px, 4vw, 42px); font-weight: 400; line-height: 1.25; }
.article-tabs { display: flex; align-items: center; gap: 18px; margin-top: 15px; padding-bottom: 8px; border-bottom: 1px solid #eaecf0; color: #3366cc; font-size: 14px; }.article-tabs span:first-child { color: #202122; font-weight: 700; }
/* Notebook / 文章双视图切换（Laup 文章才有）：tab 行右端的胶囊开关 */
.view-toggle { margin-left: auto; display: inline-flex; border: 1px solid #a2a9b1; border-radius: 999px; overflow: hidden; }
.view-toggle button { padding: 3px 12px; border: 0; background: none; color: #54595d; font: inherit; font-size: 12.5px; cursor: pointer; }
.view-toggle button + button { border-left: 1px solid #eaecf0; }
.view-toggle button.on { background: #eaecf0; color: #202122; font-weight: 700; }
.article-tabs .tabs-separator { color: #c8ccd1; font-weight: 400; }
.tab-action { padding: 0; border: 0; background: none; color: #3366cc; font: inherit; font-size: 14px; cursor: pointer; }
.tab-action:hover { text-decoration: underline; }
.tab-action.tab-current { color: #202122; font-weight: 700; cursor: default; text-decoration: none; }
/* ── 历史版本 / diff ─────────────────────────────────────────── */
.history-panel { padding-top: 20px; font-family: Georgia, "Noto Serif SC", "Songti SC", serif; }
.state-inline { color: #54595d; font-size: 14px; }.state-inline.error { color: #b32424; }
.diff-picker { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; color: #202122; font-size: 14px; }
.diff-picker select { padding: 3px 6px; border: 1px solid #a2a9b1; border-radius: 3px; font: inherit; font-size: 13px; background: #fff; }
.diff-picker .diff-meta { flex-basis: 100%; color: #54595d; font-size: 12.5px; }
.diff-view { border: 1px solid #a2a9b1; border-radius: 3px; overflow: hidden; font-family: Consolas, "Courier New", monospace; font-size: 12.8px; line-height: 1.55; margin-bottom: 18px; }
.diff-line { display: flex; min-width: 0; }
.diff-gutter { flex: 0 0 26px; text-align: center; color: #72777d; user-select: none; }
.diff-text { flex: 1; min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere; padding-right: 8px; }
.diff-del { background: #fee7e6; }.diff-del .diff-gutter { color: #b32424; }
.diff-add { background: #d5fdf4; }.diff-add .diff-gutter { color: #096459; }
.diff-skip { padding: 3px 10px; color: #72777d; background: #f8f9fa; border-block: 1px solid #eaecf0; text-align: center; font-family: inherit; }
.revision-list { list-style: none; margin: 0; padding: 0; font-size: 13.5px; }
.revision-list li { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 7px 2px; border-bottom: 1px solid #eaecf0; }
.rev-no { font-family: Consolas, monospace; font-weight: 700; color: #202122; min-width: 34px; }
.rev-avatar { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }
.rev-editor { color: #3366cc; }
.revision-list time { color: #72777d; font-size: 12.5px; }
.rev-note { color: #54595d; font-style: italic; overflow-wrap: anywhere; }
.rev-actions { margin-left: auto; display: flex; gap: 12px; }
.contributor { display: inline-flex; align-items: center; gap: 4px; margin-right: 8px; white-space: nowrap; }
.contributor img { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; vertical-align: -4px; }
.contributor small { color: #72777d; }
.tab-action.danger { color: #b32424; }
.tab-action:disabled { color: #9ca3af; cursor: default; text-decoration: none; }
.article-header p { margin: 13px 0; color: #54595d; font-size: 13px; }
.article-content { padding-top: 20px; font-family: Georgia, "Noto Serif SC", "Songti SC", serif; font-size: 16px; line-height: 1.9; overflow-wrap: anywhere; }
/* laup.css 的 .doc 自带「独立文档页」的版式盒（780px 定宽 + 大内边距），
   在详情页的文章纸里套这层会打架 —— 版式归 .article-paper 管，这里只留排版规则 */
.article-content :deep(.laup-post-html.doc) { max-width: none; padding: 0; margin: 0; }
/* Notebook 视图的渲染失败框（notebook.css 的 .error-out 只在 #notebook-page 作用域内） */
.article-content :deep(.error-out) { margin: 12px 0; padding: 10px 12px; border: 1px solid #ffc7c2; border-radius: 4px; background: #fee7e6; color: #b32424; font: 0.88em/1.55 Consolas, "Courier New", monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
.article-content :deep(.laup-cite a) { color: #3366cc; text-decoration: none; }
.article-content :deep(.laup-cite a:hover) { text-decoration: underline; }
.article-content :deep([id^="section-"]) { scroll-margin-top: 84px; }
/* \cite 的锚点目标（laup-citation-N）与文末文献列表的落点 */
.article-content :deep([id^="laup-citation"]), .article-content :deep([id^="laup-references"]) { scroll-margin-top: 84px; }
.article-content :deep(h1), .article-content :deep(h2), .article-content :deep(h3) { margin: 1.8em 0 .7em; padding-bottom: .25em; border-bottom: 1px solid #eaecf0; color: #202122; font-family: Georgia, "Noto Serif SC", serif; font-weight: 400; line-height: 1.35; }
.article-content :deep(h2) { font-size: 28px; }.article-content :deep(h3) { font-size: 22px; }
.article-content :deep(p), .article-content :deep(ul), .article-content :deep(ol) { margin: 0 0 1.2em; }
.article-content :deep(a) { color: #3366cc; }.article-content :deep(a:hover) { text-decoration: underline; }
.article-content :deep(img) { display: block; max-width: 100%; height: auto; margin: 24px auto; }
/* blockquote / pre / 代码高亮 / 待办事项样式统一走全局 rich-content.css（与编辑器一致） */
.article-content :deep(table) { max-width: 100%; border-collapse: collapse; }.article-content :deep(th), .article-content :deep(td) { padding: 8px; border: 1px solid #a2a9b1; }
.infobox { border: 1px solid #a2a9b1; background: #f8f9fa; font-size: 13px; line-height: 1.55; }.infobox-heading { padding: 8px; background: #eaecf0; color: #202122; font-weight: 700; text-align: center; }.infobox img { display: block; width: calc(100% - 20px); max-height: 210px; margin: 10px; object-fit: cover; }.infobox dl { margin: 0; padding: 0 10px 12px; }.infobox dl div { display: grid; grid-template-columns: 68px minmax(0, 1fr); gap: 8px; padding: 6px 0; border-top: 1px solid #eaecf0; }.infobox dt { font-weight: 700; }.infobox dd { margin: 0; color: #3366cc; overflow-wrap: anywhere; }
.state { display: grid; min-height: 360px; place-items: center; color: #54595d; }.state.error { color: #b32424; }
/* 讨论区：圆形悬浮按钮 + 侧栏小卡片（与 life-tree.vue 同款），顶部避开固定导航栏 */
.float-actions { position: fixed; z-index: 25; right: 18px; bottom: 18px; display: grid; gap: 10px; }
.float-button { display: grid; width: 46px; height: 46px; place-items: center; border: 1px solid #cfdad3; border-radius: 50%; background: rgba(255, 255, 255, 0.96); color: #245d43; cursor: pointer; box-shadow: 0 8px 24px rgba(23, 48, 34, 0.18); transition: transform 0.15s ease, background 0.15s ease; }
.float-button:hover { transform: translateY(-2px); background: #f1f7f3; }
.float-button.active { background: #245d43; border-color: #245d43; color: #fff; }
.comments-side-panel { position: fixed; z-index: 70; top: 78px; right: 18px; bottom: 18px; display: grid; grid-template-rows: auto minmax(0, 1fr); width: min(460px, 92vw); overflow: hidden; border: 1px solid #cfdad3; border-radius: 14px; background: #fff; box-shadow: 0 18px 60px rgba(23, 48, 34, 0.22); }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #dce5df; }
.panel-heading > div { display: grid; min-width: 0; gap: 3px; }
.panel-heading span { color: #687a70; font-size: 11px; }
.panel-heading strong { overflow: hidden; color: #183c29; text-overflow: ellipsis; white-space: nowrap; }
.panel-heading button { flex: none; padding: 7px 10px; border: 1px solid #c6d3ca; border-radius: 7px; background: #fff; color: #245d43; cursor: pointer; font: inherit; font-size: 12px; }
.panel-body { overflow-y: auto; padding: 18px 16px; background: #f4f8f6; }
.comments-body { display: block; background: #fff; }
.panel-slide-enter-active, .panel-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.panel-slide-enter-from, .panel-slide-leave-to { transform: translateX(24px); opacity: 0; }
@media (max-width: 1100px) { .article-layout { grid-template-columns: 155px minmax(0, 1fr); }.infobox { display: none; } }
@media (max-width: 760px) { .article-page { padding: 24px 16px 60px; }.article-layout { display: block; }.outline { position: static; max-height: none; overflow: visible; margin-bottom: 24px; }.article-header h1 { font-size: 30px; }.article-content { font-size: 16px; } .comments-side-panel { top: 64px; right: 0; bottom: 0; left: 0; width: auto; border-radius: 0; } }
</style>
