<script setup>
import { computed, onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import {
  deleteMediaImage,
  fetchHomeGallery,
  fetchMediaLibrary,
  updateHomeGallery,
} from "@/services/media";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const images = ref([]);
const usage = ref({ usedBytes: 0, quotaBytes: 0 });
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const loading = ref(false);
const deletingHash = ref("");
const message = ref("");
const homeGalleryHashes = ref([]);
const savedHomeGalleryHashes = ref([]);
const savingHomeGallery = ref(false);

const usedPercent = computed(() => {
  const quota = Number(usage.value.quotaBytes || 0);
  return quota ? Math.min(100, (Number(usage.value.usedBytes || 0) / quota) * 100) : 0;
});
const homeGalleryChanged = computed(() =>
  homeGalleryHashes.value.join(",") !== savedHomeGalleryHashes.value.join(","),
);

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

async function loadLibrary(targetPage = page.value) {
  loading.value = true;
  message.value = "";
  try {
    const payload = await fetchMediaLibrary(targetPage);
    images.value = payload.images || [];
    usage.value = payload.usage || usage.value;
    page.value = payload.page || 1;
    total.value = payload.total || 0;
    totalPages.value = payload.totalPages || 1;
  } catch (error) {
    message.value = error.message || "图片库加载失败";
  } finally {
    loading.value = false;
  }
}

async function removeImage(image) {
  if (image.referenceCount > 0 || image.homeGallery || isHomeImage(image.hash) || deletingHash.value) {
    return;
  }
  if (!window.confirm("确定删除这张未使用的图片吗？删除后无法恢复。")) return;
  deletingHash.value = image.hash;
  message.value = "";
  try {
    await deleteMediaImage(image.hash);
    message.value = "图片已删除，空间额度已经返还。";
    await loadLibrary(images.value.length === 1 && page.value > 1 ? page.value - 1 : page.value);
  } catch (error) {
    message.value = error.message || "图片删除失败";
  } finally {
    deletingHash.value = "";
  }
}

function isHomeImage(hash) {
  return homeGalleryHashes.value.includes(hash);
}

function homeImagePosition(hash) {
  const index = homeGalleryHashes.value.indexOf(hash);
  return index < 0 ? 0 : index + 1;
}

function toggleHomeImage(image) {
  const index = homeGalleryHashes.value.indexOf(image.hash);
  if (index >= 0) {
    homeGalleryHashes.value.splice(index, 1);
    return;
  }
  if (homeGalleryHashes.value.length >= 10) {
    message.value = "首页画册最多选择 10 张图片。";
    return;
  }
  homeGalleryHashes.value.push(image.hash);
}

function moveHomeImage(hash, direction) {
  const index = homeGalleryHashes.value.indexOf(hash);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= homeGalleryHashes.value.length) return;
  const reordered = [...homeGalleryHashes.value];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  homeGalleryHashes.value = reordered;
}

async function loadHomeGallerySelection() {
  if (!userStore.isSiteOwner) return;
  try {
    const payload = await fetchHomeGallery();
    const hashes = (payload.images || []).map((image) => image.hash);
    homeGalleryHashes.value = hashes;
    savedHomeGalleryHashes.value = [...hashes];
  } catch (error) {
    message.value = error.message || "首页画册配置加载失败";
  }
}

async function saveHomeGallery() {
  if (!userStore.isSiteOwner || savingHomeGallery.value) return;
  savingHomeGallery.value = true;
  message.value = "";
  try {
    await updateHomeGallery(homeGalleryHashes.value);
    savedHomeGalleryHashes.value = [...homeGalleryHashes.value];
    const selected = new Set(homeGalleryHashes.value);
    images.value.forEach((image) => {
      image.homeGallery = selected.has(image.hash);
    });
    message.value = homeGalleryHashes.value.length
      ? `首页画册已更新，共 ${homeGalleryHashes.value.length} 张图片。`
      : "首页画册已清空，主页将显示默认图片。";
  } catch (error) {
    message.value = error.message || "首页画册保存失败";
  } finally {
    savingHomeGallery.value = false;
  }
}

onMounted(async () => {
  await userStore.initialize();
  await Promise.all([loadLibrary(1), loadHomeGallerySelection()]);
});
</script>

<template>
  <navBar />
  <main class="library-page">
    <header class="heading">
      <div>
        <span>MEDIA LIBRARY</span>
        <h1>我的图片库</h1>
        <p>文章、进化树与 XMind 导入共用这里的空间；相同图片不会重复占用 R2。</p>
      </div>
      <RouterLink to="/user-space">返回我的空间</RouterLink>
    </header>

    <section class="usage-card">
      <div><strong>{{ formatBytes(usage.usedBytes) }}</strong> / {{ formatBytes(usage.quotaBytes) }}</div>
      <div class="usage-track" role="progressbar" :aria-valuenow="usedPercent" aria-valuemin="0" aria-valuemax="100">
        <span :style="{ width: `${usedPercent}%` }"></span>
      </div>
      <p>默认会在浏览器端压缩图片。确需大量高清图片时，可由管理员单独提高你的额度。</p>
    </section>

    <section v-if="userStore.isSiteOwner" class="home-gallery-manager">
      <div>
        <span>HOME ALBUM · UID 1</span>
        <h2>主页画册</h2>
        <p>
          从下方图片库选择最多 10 张图片；选择顺序就是主页播放顺序。
          当前已选 {{ homeGalleryHashes.length }} 张。
        </p>
      </div>
      <button
        type="button"
        :disabled="!homeGalleryChanged || savingHomeGallery"
        @click="saveHomeGallery"
      >
        {{ savingHomeGallery ? "保存中……" : homeGalleryChanged ? "保存主页画册" : "画册已保存" }}
      </button>
    </section>

    <p v-if="message" class="message">{{ message }}</p>
    <p v-if="loading" class="state">正在加载图片库……</p>
    <section v-else-if="images.length" class="image-grid">
      <article v-for="image in images" :key="image.hash" class="image-card">
        <a :href="image.url" target="_blank" rel="noopener">
          <img :src="image.url" :alt="`${image.width}×${image.height} 图片`" loading="lazy" />
        </a>
        <div class="image-info"><strong>{{ image.width }} × {{ image.height }}</strong><span>{{ formatBytes(image.bytes) }}</span></div>
        <p v-if="image.referenceCount">正被 {{ image.referenceCount }} 篇文章或进化树使用</p>
        <p v-else>尚未被已发布内容使用</p>
        <div v-if="userStore.isSiteOwner" class="home-image-controls">
          <button
            type="button"
            :class="{ selected: isHomeImage(image.hash) }"
            @click="toggleHomeImage(image)"
          >
            {{ isHomeImage(image.hash) ? `画册第 ${homeImagePosition(image.hash)} 张` : "加入主页画册" }}
          </button>
          <template v-if="isHomeImage(image.hash)">
            <button
              type="button"
              aria-label="在主页画册中前移"
              :disabled="homeImagePosition(image.hash) <= 1"
              @click="moveHomeImage(image.hash, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="在主页画册中后移"
              :disabled="homeImagePosition(image.hash) >= homeGalleryHashes.length"
              @click="moveHomeImage(image.hash, 1)"
            >
              ↓
            </button>
          </template>
        </div>
        <button
          type="button"
          :disabled="
            image.referenceCount > 0 ||
            image.homeGallery ||
            isHomeImage(image.hash) ||
            deletingHash === image.hash
          "
          :title="
            image.homeGallery || isHomeImage(image.hash)
              ? '请先从主页画册移除并保存'
              : image.referenceCount
                ? '请先从文章或进化树中移除该图片'
                : '删除图片'
          "
          @click="removeImage(image)"
        >
          {{
            deletingHash === image.hash
              ? "删除中……"
              : image.homeGallery || isHomeImage(image.hash)
                ? "首页使用中，不能删除"
                : image.referenceCount
                  ? "使用中，不能删除"
                  : "删除并释放空间"
          }}
        </button>
      </article>
    </section>
    <p v-else class="state">图片库还是空的。你可以在发布文章或制作进化树时上传本地图片。</p>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="loading || page <= 1" @click="loadLibrary(page - 1)">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 张</span>
      <button :disabled="loading || page >= totalPages" @click="loadLibrary(page + 1)">下一页</button>
    </div>
  </main>
</template>

<style scoped>
.library-page{min-height:100vh;padding:84px 20px 60px;background:#f4f8f6;color:#20342b}.heading,.usage-card,.message,.state,.image-grid,.pagination{width:min(100%,1180px);margin-left:auto;margin-right:auto}.heading{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:22px}.heading span{color:#18734a;font-size:.75rem;font-weight:800;letter-spacing:.14em}.heading h1{margin:4px 0 5px;font-size:2rem}.heading p{margin:0;color:#64748b}.heading a{padding:9px 13px;border:1px solid #bfd4c8;border-radius:7px;background:#fff;color:#176b43;text-decoration:none;white-space:nowrap}.usage-card{box-sizing:border-box;padding:18px 20px;border:1px solid #d5e2da;border-radius:11px;background:#fff}.usage-card strong{font-size:1.25rem}.usage-track{height:9px;margin:11px 0;border-radius:99px;background:#e2ebe6;overflow:hidden}.usage-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#23875a,#60b47f)}.usage-card p{margin:0;color:#64748b;font-size:.88rem}.message{box-sizing:border-box;margin-top:14px;padding:10px 13px;border-radius:7px;background:#e9f5ee;color:#176b43}.state{box-sizing:border-box;padding:54px 16px;text-align:center;color:#64748b}.image-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:20px}.image-card{min-width:0;padding:12px;border:1px solid #dbe6df;border-radius:10px;background:#fff}.image-card>a{display:grid;height:170px;place-items:center;overflow:hidden;border-radius:7px;background:#eef3f0}.image-card img{width:100%;height:100%;object-fit:contain}.image-info{display:flex;justify-content:space-between;gap:8px;margin-top:11px}.image-info span,.image-card p{color:#64748b;font-size:.78rem}.image-card p{min-height:2.4em;margin:7px 0}.image-card button,.pagination button{width:100%;padding:8px 10px;border:0;border-radius:6px;background:#176b43;color:#fff;cursor:pointer}.image-card button:disabled,.pagination button:disabled{background:#aebbb4;cursor:not-allowed}.pagination{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:22px}.pagination button{width:auto}.pagination span{color:#64748b}@media(max-width:960px){.image-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.library-page{padding:76px 12px 40px}.heading{display:block}.heading a{display:inline-block;margin-top:14px}.image-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.image-card>a{height:135px}}@media(max-width:430px){.image-grid{grid-template-columns:1fr}.image-card>a{height:210px}}
.home-gallery-manager{display:flex;box-sizing:border-box;width:min(100%,1180px);align-items:center;justify-content:space-between;gap:22px;margin:16px auto 0;padding:18px 20px;border:1px solid #c9b6e3;border-radius:11px;background:linear-gradient(135deg,#faf8fd,#f2ecf9);color:#35294a}.home-gallery-manager span{color:#7650a9;font-size:.68rem;font-weight:850;letter-spacing:.14em}.home-gallery-manager h2{margin:3px 0 4px;font-size:1.2rem}.home-gallery-manager p{margin:0;color:#736681;font-size:.84rem}.home-gallery-manager>button{flex:0 0 auto;padding:9px 13px;border:1px solid #7350a5;border-radius:7px;background:#7350a5;color:#fff;font:inherit;font-size:.8rem;font-weight:750;cursor:pointer}.home-gallery-manager>button:disabled{border-color:#bbb0c9;background:#bbb0c9;cursor:default}.home-image-controls{display:grid;grid-template-columns:minmax(0,1fr) 34px 34px;gap:5px;margin:9px 0}.image-card .home-image-controls button{width:auto;min-width:0;padding:7px 6px;border:1px solid #c7b8d9;background:#faf8fd;color:#664491}.image-card .home-image-controls button:first-child{grid-column:1/-1}.image-card .home-image-controls button.selected{border-color:#7852b7;background:#7852b7;color:#fff}.image-card .home-image-controls button:disabled{border-color:#d8d1df;background:#eeeaf2;color:#a59cad}@media(max-width:700px){.home-gallery-manager{display:block}.home-gallery-manager>button{margin-top:13px}}
</style>
