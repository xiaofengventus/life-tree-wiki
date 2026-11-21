import { createRouter, createWebHistory } from "vue-router";
import { requireAuth } from "@/utils/navigation";

import homeView from "@/views/首页.vue";

const loginView = () => import("@/views/登录页面.vue");
const userSpace = () => import("@/views/user_space.vue");
const createPost = () => import("@/views/create_user_post.vue");
const viewPost = () => import("@/views/WikiPostDetail.vue");
const createTree = () => import("@/views/evolution_user_tree.vue");
// viewTree（SVG 画布渲染）已停用：树阅读统一由 life-tree 的 DOM 渲染承担
// const viewTree = () => import("@/views/WikiTreeDetail.vue");
const searchView = () => import("@/views/WikiSearch.vue");
const platformTrees = () => import("@/views/PlatformTrees.vue");
const notifications = () => import("@/views/notifications.vue");
const mediaLibrary = () => import("@/views/media_library.vue");
const drafts = () => import("@/views/draft_box.vue");
const userManagement = () => import("@/views/user_management.vue");
const deletedPosts = () => import("@/views/admin_deleted_posts.vue");
const officialTrees = () => import("@/views/official_tree_admin.vue");
const lifeTree = () => import("@/views/LifeTree.vue");
const treeContributions = () => import("@/views/tree_contributions.vue");
const columns = () => import("@/views/Columns.vue");
const collectionDetail = () => import("@/views/collection_detail.vue");
// Laup 写作（Vue 内置版）：编辑器内核在 src/laup/，页面为 src/views/laup_editor.vue。
// 发布链路仍旧收 Laup 源码（contentFormat:'laup'），由 server/laup.js 用 Laup 渲染器重渲。
const laupEditor = () => import("@/views/laup_editor.vue");
// laup Notebook（Jupyter 式多格编辑器）：模块在 src/notebook/，与旧版 laup 写作互不影响。
// 提交文章走同一条发布管道（contentFormat:'laup' → server/laup.js 重渲 → wiki-detail 展示）。
const notebookView = () => import("@/notebook/NotebookView.vue")
// Laup v2 公测：编辑器与 Notebook 完全共用（NotebookView），只有预览换 v2 内核。
// 两套内核的本地稿互不可见（store 里按键隔离），v1 原样保留。
const createHub = () => import("@/views/CreateHub.vue");
// [lifetree] 格全局预览（新窗口）：时序图 + 地质年代轴，数据经 localStorage 传递
const lifetreePreview = () => import("@/views/LifetreeChronoView.vue");
// 移动端登录授权：网页登录后生成 60 秒一次性 code，App 粘贴换会话
const mobileAuthHandoff = () => import("@/views/MobileAuthHandoff.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/ls/:id?", name: "ls-project", component: () => import("@/views/LSWorkspace.vue") },
    { path: "/", name: "home", component: homeView },
    { path: "/login", name: "login", component: loginView },
    { path: "/search", name: "search", component: searchView },
    { path: "/research", redirect: "/search" },
    { path: "/wiki/:title", name: "wiki-post", component: viewPost },
    { path: "/platform-trees", name: "platform-trees", component: platformTrees },
    { path: "/life-tree/:id?", name: "life-tree", component: lifeTree },
    { path: "/columns", name: "columns", component: columns },
    { path: "/collections/:id", name: "collection-detail", component: collectionDetail },
    { path: "/create-post", name: "create-post", component: createPost },
    { path: "/laup", name: "laup", component: laupEditor },
    { path: "/notebook", name: "notebook", component: notebookView },
    // v2 公测入口：同一套编辑器与草稿流程，预览改由 src/laup2 渲染
    { path: "/laup-v2", name: "laup-v2", component: notebookView, props: { kernel: "v2" } },
    // 创作中心：六项创作入口的汇总页（B 站创作区式的左侧栏布局）
    { path: "/create", name: "create", component: createHub },
    { path: "/lifetree-preview", name: "lifetree-preview", component: lifetreePreview },
    { path: "/view-post/:id", name: "view-post", component: viewPost },
    { path: "/evolution-tree", name: "create-tree", component: createTree },
    { path: "/tree-contributions/:id?", name: "tree-contributions", component: treeContributions, meta: { requiresAuth: true } },
    // 树阅读统一走 life-tree 的 DOM 渲染（SVG 画布在大节点量下会卡顿/崩溃），
    // 旧 /view-tree/:id 链接（含存量数据里的）一律重定向过去
    { path: "/view-tree/:id", redirect: (to) => `/life-tree/${to.params.id}` },
    { path: "/view-tree", redirect: "/life-tree" },
    { path: "/user-space", name: "user-space", component: userSpace, meta: { requiresAuth: true } },
    { path: "/users/:uid", name: "public-user-space", component: userSpace },
    { path: "/notifications", name: "notifications", component: notifications, meta: { requiresAuth: true } },
    { path: "/media-library", name: "media-library", component: mediaLibrary, meta: { requiresAuth: true } },
    { path: "/drafts", name: "drafts", component: drafts, meta: { requiresAuth: true } },
    { path: "/mobile-auth", name: "mobile-auth", component: mobileAuthHandoff, meta: { requiresAuth: true } },
    { path: "/admin/users", name: "admin-users", component: userManagement, meta: { requiresAuth: true, siteOwnerOnly: true } },
    { path: "/admin/deleted-posts/:id?", name: "admin-deleted-posts", component: deletedPosts, meta: { requiresAuth: true, siteOwnerOnly: true } },
    { path: "/admin/official-trees", name: "admin-official-trees", component: officialTrees, meta: { requiresAuth: true, roles: ["ADMIN"] } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(requireAuth);

export default router;
