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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    { path: "/admin/users", name: "admin-users", component: userManagement, meta: { requiresAuth: true, siteOwnerOnly: true } },
    { path: "/admin/deleted-posts/:id?", name: "admin-deleted-posts", component: deletedPosts, meta: { requiresAuth: true, siteOwnerOnly: true } },
    { path: "/admin/official-trees", name: "admin-official-trees", component: officialTrees, meta: { requiresAuth: true, roles: ["ADMIN"] } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(requireAuth);

export default router;
