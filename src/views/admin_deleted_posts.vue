<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import navBar from "@/components/navBar.vue";
import { fetchDeletedPost, fetchDeletedPosts } from "@/services/adminContent";
import { formatDateTime } from "@/utils/date";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { renderFormulaNodes } from "@/utils/formula";

const route = useRoute();
const posts = ref([]);
const selectedPost = ref(null);
const loading = ref(true);
const message = ref("");
const selectedPostContent = computed(() =>
  renderFormulaNodes(sanitizeHtml(selectedPost.value?.content || "")),
);

async function loadDeletedPosts() {
  loading.value = true;
  message.value = "";
  try {
    posts.value = await fetchDeletedPosts();
  } catch (error) {
    message.value = error.message || "已删除文章列表加载失败";
  } finally {
    loading.value = false;
  }
}

async function loadSelectedPost() {
  selectedPost.value = null;
  const id = String(route.params.id || "");
  if (!id) return;
  try {
    selectedPost.value = await fetchDeletedPost(id);
  } catch (error) {
    message.value = error.message || "已删除文章加载失败";
  }
}

watch(
  () => route.params.id,
  () => {
    void loadSelectedPost();
  },
  { immediate: true },
);
void loadDeletedPosts();
</script>

<template>
  <navBar />
  <main class="deleted-posts-page">
    <header>
      <div>
        <span>ADMIN CONTENT ARCHIVE</span>
        <h1>已删除文章</h1>
        <p>文章正文、修订历史和 UID 均被保留，仅站点所有者可以访问。</p>
      </div>
      <RouterLink to="/admin/users">返回用户管理</RouterLink>
    </header>

    <p v-if="message" class="page-message">{{ message }}</p>
    <section class="archive-layout">
      <aside class="deleted-list">
        <p v-if="loading">正在加载……</p>
        <template v-else>
          <RouterLink
            v-for="post in posts"
            :key="post.id"
            :to="`/admin/deleted-posts/${post.uid || post.id}`"
            :class="{ active: selectedPost?.id === post.id }"
          >
            <div><strong>{{ post.title }}</strong><span class="deleted-badge">已删除</span></div>
            <small>{{ post.uid }} · {{ post.creator }}</small>
            <time :datetime="post.deletedAt">{{ formatDateTime(post.deletedAt) }}</time>
          </RouterLink>
        </template>
        <p v-if="!loading && !posts.length">暂无已删除文章。</p>
      </aside>

      <article v-if="selectedPost" class="deleted-detail">
        <div class="detail-heading">
          <span class="deleted-badge">已删除</span>
          <h2>{{ selectedPost.title }}</h2>
          <p>
            {{ selectedPost.uid }} · {{ selectedPost.creator }} ·
            删除于 {{ formatDateTime(selectedPost.deletedAt) }}
          </p>
        </div>
        <div class="deleted-content" v-html="selectedPostContent"></div>
      </article>
      <section v-else class="empty-detail">
        <span>已删除</span>
        <p>从左侧选择文章查看保留内容。</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.deleted-posts-page{min-height:100vh;padding:84px 20px 50px;background:#f4f6f8;color:#293646}.deleted-posts-page>header,.archive-layout,.page-message{width:min(100%,1380px);margin-right:auto;margin-left:auto}.deleted-posts-page>header{display:flex;justify-content:space-between;gap:24px;margin-bottom:18px}.deleted-posts-page>header span{color:#a23c3c;font-size:.72rem;font-weight:800;letter-spacing:.14em}.deleted-posts-page h1{margin:4px 0 6px}.deleted-posts-page header p{margin:0;color:#687586}.deleted-posts-page header a{height:max-content;padding:8px 12px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#40556a;text-decoration:none}.page-message{margin-bottom:12px;color:#a23c3c}.archive-layout{display:grid;grid-template-columns:360px minmax(0,1fr);min-height:680px;overflow:hidden;border:1px solid #d8e0e7;border-radius:12px;background:#fff;box-shadow:0 12px 35px rgba(31,45,61,.07)}.deleted-list{overflow-y:auto;border-right:1px solid #e3e8ed;background:#f8fafb}.deleted-list>a{display:grid;gap:5px;padding:15px 16px;border-bottom:1px solid #e8edf1;color:#334155;text-decoration:none}.deleted-list>a:hover,.deleted-list>a.active{background:#fff4f4}.deleted-list>a>div{display:flex;align-items:center;justify-content:space-between;gap:10px}.deleted-list strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.deleted-list small,.deleted-list time{color:#7b8794;font-size:.76rem}.deleted-list>p{padding:20px;color:#7b8794}.deleted-badge{display:inline-flex;width:max-content;padding:3px 7px;border-radius:999px;background:#fee2e2!important;color:#a32626!important;font-size:.68rem!important;font-weight:800;letter-spacing:0!important}.deleted-detail{min-width:0;padding:34px 42px}.detail-heading{padding-bottom:20px;border-bottom:1px solid #e5e9ed}.detail-heading h2{margin:8px 0 5px}.detail-heading p{margin:0;color:#7a8793;font-size:.82rem}.deleted-content{padding:30px 0;color:#374151;line-height:1.8;overflow-wrap:anywhere}.deleted-content :deep(img){max-width:100%;height:auto}.empty-detail{display:grid;place-items:center;align-content:center;color:#8995a1}.empty-detail span{font-size:2rem;font-weight:800;color:#d5a7a7}.empty-detail p{margin:5px 0}@media(max-width:760px){.deleted-posts-page{padding:76px 8px 24px}.deleted-posts-page>header{display:block;padding:0 8px}.deleted-posts-page header a{display:inline-block;margin-top:12px}.archive-layout{display:block}.deleted-list{max-height:320px;border-right:0;border-bottom:1px solid #e3e8ed}.deleted-detail{padding:24px 18px}.empty-detail{min-height:300px}}
</style>
