<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const userStore = useUserStore();

const spaceTarget = computed(() =>
  userStore.isLoggedIn ? "/user-space" : "/login",
);

const links = computed(() => [
  { label: "首页", to: "/" },
  { label: "专栏", to: "/columns" },
  { label: "生命树", to: "/life-tree" },
  // 创作入口统一收进创作中心（/create）：左侧栏列出 LifeSequence、Laup 写作、
  // Notebook、Laup v2、创建专栏、创建树。顶栏只留一个总入口。
  { label: "创作中心", to: "/create" },
  // Laup v2 公测：与 Notebook 同一套编辑器，预览改由 v2 内核渲染；v1 原样保留。
  { label: "Laup v2", to: "/laup-v2" },
  // 计算机网络图解三部曲：public/computer-network/ 下的纯静态页（不入 Vue 路由），
  // 用 external 整页跳转；站内互链全是相对路径，必须保持同目录。
  { label: "计算机网络", to: "/computer-network/", external: true },
  { label: "个人空间", to: spaceTarget.value },
  { label: "通知", to: "/notifications" },
  // 平台树入口暂时下线（SVG 画布在大节点量下会卡顿，统一走 life-tree 的 DOM 渲染）
  // { label: "平台树", to: "/platform-trees" },
]);

function isActive(to) {
  if (to === "/") return route.path === "/";
  return route.path === to;
}

onMounted(() => userStore.initialize());
</script>

<template>
  <header class="wiki-header">
    <nav class="wiki-nav" aria-label="主导航">
      <RouterLink class="wiki-brand" to="/" aria-label="生命时序 Wiki 首页">
        生命时序
      </RouterLink>
      <div class="wiki-links">
        <!-- external 的那几条是整页跳转（<a>），其余走 RouterLink。
             两种都用 <a> 渲染，所以下面 .wiki-links a 那套样式对两者一视同仁。 -->
        <template v-for="link in links" :key="link.label">
          <a v-if="link.external" :href="link.to">{{ link.label }}</a>
          <RouterLink
            v-else
            :to="link.to"
            :class="{ active: isActive(link.to) }"
          >
            {{ link.label }}
          </RouterLink>
        </template>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.wiki-header {
  position: sticky;
  z-index: 50;
  top: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}
.wiki-nav {
  display: flex;
  width: min(100% - 48px, 1240px);
  min-height: 64px;
  margin: 0 auto;
  align-items: center;
  gap: 42px;
}
.wiki-brand {
  flex: none;
  color: #111827;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
}
.wiki-links {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}
.wiki-links::-webkit-scrollbar { display: none; }
.wiki-links a {
  flex: none;
  padding: 8px 10px;
  border-bottom: 2px solid transparent;
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.wiki-links a:hover,
.wiki-links a.active { border-bottom-color: #111827; color: #111827; }
@media (max-width: 760px) {
  .wiki-nav { width: min(100% - 28px, 1240px); gap: 22px; }
  .wiki-brand { font-size: 18px; }
  .wiki-links { gap: 2px; }
  .wiki-links a { padding: 8px 7px; font-size: 13px; }
}
</style>
