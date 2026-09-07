<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import create_post from "@/components/create_post.vue";
import navBar from "@/components/navBar.vue";
import { createPost, updatePost } from "@/services/posts";
import { deleteDraft } from "@/services/drafts";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();
const submitting = ref(false);
const submitError = ref("");

async function handleSubmit(post, { draftId = "", visibility = "PUBLIC" } = {}) {
  if (submitting.value) return;
  submitting.value = true;
  submitError.value = "";
  try {
    const creating = !post.id;
    const saved = post.id ? await updatePost(post.id, post) : await createPost(post);
    if (creating || visibility === "PUBLIC") {
      await userStore.initialize({ force: true });
    }
    if (draftId) {
      await deleteDraft(draftId).catch((error) => {
        console.warn("文章已保存，但本地草稿清理失败", error);
      });
    }
    if (saved.visibility === "PRIVATE") {
      await router.replace({
        path: "/create-post",
        query: {
          edit: saved.uid || saved.id,
          saved: String(Date.now()),
        },
      });
    } else {
      await router.push({
        name: "wiki-post",
        params: { title: saved.title },
      });
    }
  } catch (error) {
    submitError.value = error.message || "提交失败，请检查网络后重试";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <navBar />
  <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
  <create_post :submitting="submitting" @submit="handleSubmit" />
</template>

<style scoped>
.submit-error {
  position: fixed;
  z-index: 700;
  top: 68px;
  left: 50%;
  max-width: min(90vw, 720px);
  margin: 0;
  padding: 10px 16px;
  transform: translateX(-50%);
  border-radius: 8px;
  background: #fee2e2;
  color: #b91c1c;
}
</style>
