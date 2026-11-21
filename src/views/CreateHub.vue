<script setup>
// 创作中心：把分散在导航里的创作入口收进一个页面（左侧栏 + 右侧入口卡片）。
// 只借 B 站创作区的版式语言（浅灰底 / 白色侧栏 / 蓝色强调），不搬它的数据面板。
// 每个入口仍跳转到原来的独立页面，编辑器本身没有被拆改。
import NavBar from "@/components/navBar.vue";

const tools = [
  {
    to: "/ls",
    name: "LifeSequence",
    en: "LifeSequence",
    desc: "上传模型、签出子树、编辑锁与提交合并的网页协作视图。",
    icon: "M6 3v12a3 3 0 0 0 3 3h9M6 9h9a3 3 0 0 0 3-3V3",
  },
  {
    to: "/laup",
    name: "Laup 写作",
    en: "Laup Editor",
    desc: "整篇文档式的 Laup 编辑器，适合长文与结构化章节。",
    icon: "M4 20h4l10-10-4-4L4 16v4zM14 6l4 4",
  },
  {
    to: "/notebook",
    name: "Notebook",
    en: "Notebook",
    desc: "Jupyter 式多格编辑器：变量、代码、输入输出对照卡。",
    icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  },
  {
    to: "/laup-v2",
    name: "Laup v2",
    en: "Laup v2",
    desc: "与 Notebook 同一套编辑器，预览改由 v2 内核渲染（Lexer → AST → 语义 → 渲染）。",
    icon: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3",
    tag: "公测",
  },
  {
    to: "/create-post",
    name: "创建专栏",
    en: "Article",
    desc: "富文本文章与 Wiki 百科风格条目，支持分类卡与引用来源。",
    icon: "M6 3h7l5 5v13H6zM13 3v5h5",
  },
  {
    to: "/evolution-tree",
    name: "创建树",
    en: "Evolution Tree",
    desc: "建立、编辑与提交演化树，节点可挂文献、图片与说明。",
    icon: "M12 3v4M12 7c0 3-6 3-6 6v2M12 7c0 3 6 3 6 6v2M6 15v3M18 15v3M12 7v8",
  },
];
</script>

<template>
  <div class="hub-page">
    <NavBar />
    <div class="hub-layout">
      <aside class="hub-side">
        <p class="side-title">创作中心</p>
        <nav class="side-nav">
          <span class="side-item is-active">概览</span>
          <RouterLink v-for="tool in tools" :key="tool.to" class="side-item" :to="tool.to">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="tool.icon" />
            </svg>
            <span>{{ tool.name }}</span>
            <em v-if="tool.tag">{{ tool.tag }}</em>
          </RouterLink>
        </nav>
      </aside>

      <main class="hub-main">
        <header class="hub-head">
          <h1>创作中心</h1>
          <p>写文章、做 Notebook、维护演化树。所有创作入口都在这里。</p>
        </header>

        <div class="hub-grid">
          <RouterLink v-for="tool in tools" :key="tool.to" class="tool-card" :to="tool.to">
            <span class="tool-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="tool.icon" />
              </svg>
            </span>
            <span class="tool-body">
              <span class="tool-title">
                {{ tool.name }}
                <em v-if="tool.tag" class="tool-tag">{{ tool.tag }}</em>
              </span>
              <span class="tool-en">{{ tool.en }}</span>
              <span class="tool-desc">{{ tool.desc }}</span>
            </span>
            <span class="tool-go">进入 →</span>
          </RouterLink>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.hub-page {
  min-height: 100vh;
  background: #f6f7f8;
  color: #1f2328;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
.hub-layout {
  display: flex;
  width: min(100% - 48px, 1240px);
  margin: 0 auto;
  padding: 22px 0 70px;
  gap: 20px;
  align-items: flex-start;
}

/* ── 左侧栏 ─────────────────────────────────────────────── */
.hub-side {
  position: sticky;
  top: 86px;
  flex: none;
  width: 188px;
  padding: 14px 10px;
  border-radius: 10px;
  background: #fff;
}
.side-title {
  margin: 2px 8px 10px;
  color: #9499a0;
  font-size: 12px;
  letter-spacing: .08em;
}
.side-nav { display: grid; gap: 2px; }
.side-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 7px;
  color: #4b5563;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.side-item svg {
  width: 16px; height: 16px; flex: none;
  fill: none; stroke: currentColor; stroke-width: 1.7;
  stroke-linecap: round; stroke-linejoin: round;
}
.side-item:hover { background: #f2f6fb; color: #1f6feb; }
.side-item.is-active { background: #e8f3ff; color: #1a6fc4; }
.side-item em {
  margin-left: auto;
  padding: 1px 6px;
  border-radius: 999px;
  background: #e8f3ff;
  color: #1a6fc4;
  font-size: 10.5px;
  font-style: normal;
  font-weight: 600;
}

/* ── 右侧内容 ───────────────────────────────────────────── */
.hub-main { flex: 1; min-width: 0; }
.hub-head {
  padding: 20px 24px;
  border-radius: 10px;
  background: #fff;
}
.hub-head h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; }
.hub-head p { margin: 0; color: #6b7280; font-size: 13.5px; }

.hub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}
.tool-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #fff;
  color: inherit;
  text-decoration: none;
  transition: border-color .15s, box-shadow .15s, transform .15s;
}
.tool-card:hover {
  border-color: #cfe3ff;
  box-shadow: 0 6px 18px rgba(31, 111, 235, .08);
  transform: translateY(-1px);
}
.tool-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: #eef5ff;
  color: #1f6feb;
}
.tool-icon svg {
  width: 19px; height: 19px;
  fill: none; stroke: currentColor; stroke-width: 1.7;
  stroke-linecap: round; stroke-linejoin: round;
}
.tool-body { display: grid; gap: 3px; min-width: 0; }
.tool-title { display: flex; align-items: center; gap: 7px; font-size: 15px; font-weight: 700; }
.tool-tag {
  padding: 1px 7px;
  border: 1px solid #b6dbff;
  border-radius: 999px;
  background: #e8f3ff;
  color: #1a6fc4;
  font-size: 10.5px;
  font-style: normal;
  font-weight: 600;
}
.tool-en { color: #9aa1ab; font-size: 11.5px; letter-spacing: .04em; }
.tool-desc { margin-top: 2px; color: #5b6470; font-size: 12.8px; line-height: 1.65; }
.tool-go {
  margin-left: auto;
  align-self: center;
  flex: none;
  color: #1f6feb;
  font-size: 12.5px;
  font-weight: 600;
  opacity: 0;
  transition: opacity .15s;
}
.tool-card:hover .tool-go { opacity: 1; }

@media (max-width: 900px) {
  .hub-layout { display: block; width: min(100% - 28px, 1240px); }
  .hub-side { position: static; width: auto; margin-bottom: 14px; }
  .side-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hub-grid { grid-template-columns: 1fr; }
  .tool-go { opacity: 1; }
}
</style>
