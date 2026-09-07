<script setup>
import { computed, ref, watch } from "vue";
import { fetchMediaLibrary } from "@/services/media";

const props = defineProps({
  open: { type: Boolean, default: false },
  descriptionLabel: { type: String, default: "图片描述" },
  descriptionRequired: { type: Boolean, default: true },
  showDescription: { type: Boolean, default: true },
  initialDescription: { type: String, default: "" },
});
const emit = defineEmits(["close", "select"]);

const images = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const page = ref(1);
const totalPages = ref(1);
const selected = ref(null);
const description = ref("");
const canConfirm = computed(() => Boolean(
  selected.value &&
  (!props.showDescription || !props.descriptionRequired || description.value.trim()),
));

async function load(targetPage = 1) {
  loading.value = true;
  errorMessage.value = "";
  try {
    const payload = await fetchMediaLibrary(targetPage);
    images.value = payload.images || [];
    page.value = payload.page || targetPage;
    totalPages.value = payload.totalPages || 1;
  } catch (error) {
    images.value = [];
    errorMessage.value = error.message || "图片库加载失败，请确认已经登录";
  } finally {
    loading.value = false;
  }
}

function choose(image) {
  selected.value = image;
}

function confirmSelection() {
  if (!canConfirm.value) return;
  emit("select", {
    image: selected.value,
    description: description.value.trim().slice(0, 200),
  });
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    selected.value = null;
    description.value = props.initialDescription || "";
    load(1);
  },
);
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="media-picker-backdrop" role="presentation" @click.self="emit('close')">
      <section class="media-picker" role="dialog" aria-modal="true" aria-labelledby="media-picker-title">
        <header>
          <div>
            <h2 id="media-picker-title">选择已上传图片</h2>
            <p>这里只显示你自己的图片；选择不会重复上传。</p>
          </div>
          <button type="button" aria-label="关闭图片库" @click="emit('close')">×</button>
        </header>

        <p v-if="loading" class="picker-state">正在加载图片库……</p>
        <p v-else-if="errorMessage" class="picker-state error">{{ errorMessage }}</p>
        <div v-else-if="images.length" class="media-grid">
          <button
            v-for="image in images"
            :key="image.hash"
            type="button"
            :class="{ selected: selected?.hash === image.hash }"
            @click="choose(image)"
          >
            <img :src="image.url" alt="" loading="lazy" />
            <small>{{ image.width }} × {{ image.height }}</small>
          </button>
        </div>
        <p v-else class="picker-state">你还没有上传过图片。</p>

        <nav v-if="totalPages > 1" class="picker-pages" aria-label="图片库分页">
          <button type="button" :disabled="page <= 1 || loading" @click="load(page - 1)">上一页</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button type="button" :disabled="page >= totalPages || loading" @click="load(page + 1)">下一页</button>
        </nav>

        <label v-if="showDescription" class="description-field">
          <span>{{ descriptionLabel }}{{ descriptionRequired ? "（必填）" : "（可选）" }}</span>
          <input
            v-model.trim="description"
            maxlength="200"
            :required="descriptionRequired"
            placeholder="说明图片中是什么，以及它与正文的关系"
          />
        </label>

        <footer>
          <button type="button" class="cancel" @click="emit('close')">取消</button>
          <button type="button" class="confirm" :disabled="!canConfirm" @click="confirmSelection">
            使用这张图片
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.media-picker-backdrop{position:fixed;z-index:1200;inset:0;display:grid;padding:24px;place-items:center;background:rgba(15,23,42,.58)}.media-picker{display:grid;width:min(900px,100%);max-height:min(760px,calc(100vh - 48px));gap:14px;overflow:auto;padding:20px;border-radius:14px;background:#fff;box-shadow:0 24px 80px rgba(15,23,42,.28)}.media-picker>header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.media-picker h2{margin:0;color:#1e293b;font-size:1.25rem}.media-picker header p{margin:4px 0 0;color:#64748b}.media-picker header>button{width:36px;height:36px;border:0;border-radius:50%;background:#eef2f7;color:#475569;font-size:1.45rem;cursor:pointer}.media-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.media-grid>button{display:grid;gap:5px;overflow:hidden;padding:5px;border:2px solid transparent;border-radius:9px;background:#f1f5f9;color:#64748b;cursor:pointer}.media-grid>button.selected{border-color:#2f806a;background:#e8f4ef}.media-grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:5px;background:#e2e8f0}.picker-state{padding:42px 16px;color:#64748b;text-align:center}.picker-state.error{color:#b42318}.picker-pages{display:flex;align-items:center;justify-content:center;gap:12px}.picker-pages button,.media-picker footer button{padding:8px 13px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#475569;cursor:pointer}.description-field{display:grid;gap:6px;color:#334155;font-weight:700}.description-field input{padding:10px 12px;border:1px solid #cbd5e1;border-radius:7px;font:inherit}.media-picker footer{display:flex;justify-content:flex-end;gap:8px}.media-picker footer .confirm{border-color:#2f806a;background:#2f806a;color:#fff}.media-picker footer button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:680px){.media-picker-backdrop{align-items:end;padding:0}.media-picker{width:100%;max-height:90vh;border-radius:16px 16px 0 0;padding:15px}.media-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.media-picker footer{position:sticky;bottom:-15px;margin:0 -15px -15px;padding:12px 15px;background:#fff}}
</style>
