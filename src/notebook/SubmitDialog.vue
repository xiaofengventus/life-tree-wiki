<script setup>
// 「提交文章」对话框：把当前 Notebook 作为一篇站内文章发布。
// 流程：登录校验 → 表单 → 附件上传到媒体库（data URL → /media/<hash>）→
//       createPost（contentFormat:'laup'，服务端重渲）→ 跳转 wiki-post 详情页。
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { deleteDraft } from '@/services/drafts'
import { useNotebook } from './store.js'
import { publishNotebook } from './publish.js'

const emit = defineEmits(['close'])
const router = useRouter()
const userStore = useUserStore()
const store = useNotebook()

const title = ref(store.editPost?.title || '')
const author = ref(store.editPost?.author || userStore.user?.display_name || userStore.user?.nickname || '')
const tagInput = ref((store.editPost?.tags || []).join(', '))
const postType = ref(store.editPost?.type ?? '')
const license = ref(store.editPost?.license || '支持闭源')
const visibility = ref(store.editPost?.visibility || 'PUBLIC')
const agreement = ref(false)
const submitting = ref(false)
const progress = ref('')
const errorMessage = ref('')

const tags = computed(() =>
  tagInput.value.split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean).slice(0, 10))

async function submit() {
  if (submitting.value) return
  errorMessage.value = ''
  await userStore.initialize().catch(() => {})
  if (!userStore.isLoggedIn) {
    errorMessage.value = visibility.value === 'PRIVATE'
      ? '请先登录后再保存为仅自己可见'
      : '发布文章前请先登录或注册'
    return
  }
  if (!title.value.trim()) { errorMessage.value = '请填写标题'; return }
  if (visibility.value === 'PUBLIC' && !agreement.value) { errorMessage.value = '请先确认提交声明'; return }

  submitting.value = true
  try {
    const saved = await publishNotebook(
      store.cells,
      store.scope,
      {
        title: title.value,
        author: author.value,
        tags: tags.value,
        type: postType.value,
        license: license.value,
        visibility: visibility.value,
      },
      userStore.user,
      (done, total, stage) => {
        progress.value = stage === 'upload'
          ? `上传配图 ${done}/${total}……`
          : '提交中……'
      },
      store.editPost ? { id: store.editPost.id, version: store.editPost.version } : null,
      store.kernel,
    )
    store.toast = store.editPost ? '文章已更新' : '文章已提交'
    // 发布成功后清理草稿（与 laup_editor 同规则：草稿箱页「发布成功后，对应草稿会自动清理」）
    if (store.draftId) {
      await deleteDraft(store.draftId).catch(() => {})
      store.draftId = ''
      store.draftStatus = ''
    }
    store.editPost = null
    emit('close')
    if (saved?.visibility === 'PRIVATE') {
      await router.push({ path: '/drafts' })
    } else if (saved?.title) {
      await router.push({ name: 'wiki-post', params: { title: saved.title } })
    }
  } catch (error) {
    errorMessage.value = error.message || '提交失败，请检查网络后重试'
  } finally {
    submitting.value = false
    progress.value = ''
  }
}
</script>

<template>
  <div class="nb-submit-mask" @click.self="!submitting && emit('close')">
    <form class="nb-submit" @submit.prevent="submit">
      <header>
        <b>{{ store.editPost ? '更新文章' : '提交文章' }}</b>
        <small>{{ store.editPost ? '更新这篇已发布的 Laup 文章（保留历史版本）' : '以 Laup 源码提交，站内统一渲染展示' }}</small>
        <button type="button" class="nb-close" :disabled="submitting" @click="emit('close')">✕</button>
      </header>

      <label class="row">
        <span>标题 *</span>
        <input v-model="title" maxlength="120" placeholder="文章标题" />
      </label>
      <label class="row">
        <span>作者</span>
        <input v-model="author" maxlength="60" placeholder="留空则用昵称" />
      </label>
      <label class="row">
        <span>标签</span>
        <input v-model="tagInput" maxlength="200" placeholder="用逗号分隔，最多 10 个" />
      </label>
      <div class="row">
        <span>分类</span>
        <select v-model="postType">
          <option value="science">科普</option>
          <option value="news">新闻</option>
          <option value="">未分类</option>
        </select>
        <select v-model="license" title="协议选择">
          <option value="支持闭源">支持闭源</option>
          <option value="CC BY-NC-SA 4.0">CC BY-NC-SA 4.0</option>
          <option value="CC BY 4.0">CC BY 4.0</option>
        </select>
        <select v-model="visibility" title="可见性">
          <option value="PUBLIC">公开</option>
          <option value="PRIVATE">仅自己可见</option>
        </select>
      </div>

      <label v-if="store.editPost" class="row">
        <span>提交说明</span>
        <input v-model="changeNote" maxlength="200" placeholder="这次改了什么（会记入历史版本）" />
      </label>

      <p class="note">
        格里粘贴 / 上传的图片会先上传到你的媒体库再随文发布（单张压缩后 ≤2MB）。
        变量在发布时由服务端解析成字面值；code 格原样存进 .laup（含首行的类型声明），读者看到的只有正文。
      </p>

      <label v-if="visibility === 'PUBLIC'" class="agree">
        <input v-model="agreement" type="checkbox" />
        <span>我确认文章内容符合社区发布规范。</span>
      </label>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <footer>
        <span class="progress">{{ progress }}</span>
        <button type="button" :disabled="submitting" @click="emit('close')">取消</button>
        <button type="submit" class="primary" :disabled="submitting">
          {{ submitting ? '提交中……' : visibility === 'PRIVATE' ? '保存' : store.editPost ? '保存更新' : '公开发布' }}
        </button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.nb-submit-mask {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0, 0, 0, 0.35);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 8vh 16px 16px;
}
.nb-submit {
  width: 520px; max-width: 100%;
  background: #fff; border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  padding: 16px 18px;
  font-size: 13.5px; color: #333;
}
.nb-submit header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
.nb-submit header b { font-size: 15px; }
.nb-submit header small { color: #999; }
.nb-close {
  margin-left: auto; border: none; background: none;
  font-size: 14px; cursor: pointer; color: #999;
}
.row { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
.row > span { flex: 0 0 42px; color: #666; font-size: 12.5px; }
.row input, .row select {
  flex: 1; min-width: 0;
  border: 1px solid #d5d5d5; border-radius: 3px;
  padding: 5px 8px; font-size: 13px;
}
.row input:focus, .row select:focus { outline: none; border-color: #4b9fe1; }
.row select { flex: 0 0 auto; }
.note {
  color: #8a6d3b; background: #fcf8e3; border: 1px solid #faebcc;
  border-radius: 3px; font-size: 12px; padding: 6px 9px; margin: 10px 0;
}
.agree { display: flex; align-items: center; gap: 6px; margin: 8px 0; font-size: 12.5px; color: #555; }
.error {
  color: #c00; background: #fdf3f3; border: 1px solid #eec7c7;
  border-radius: 3px; font-size: 12.5px; padding: 5px 9px; margin: 8px 0;
}
footer { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
footer .progress { margin-right: auto; color: #2b6cb0; font-size: 12.5px; }
footer button {
  border: 1px solid #ccc; background: #f7f7f7; border-radius: 3px;
  padding: 5px 14px; font-size: 13px; cursor: pointer;
}
footer button.primary { border-color: #e25303; color: #e25303; font-weight: bold; }
footer button.primary:hover { background: #fdf1e8; }
footer button:disabled { opacity: 0.55; cursor: default; }
</style>
