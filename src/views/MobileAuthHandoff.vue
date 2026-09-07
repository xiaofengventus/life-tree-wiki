<script setup>
import { onMounted, ref } from "vue";
import AuthForm from "@/components/AuthForm.vue";
import { apiRequest } from "@/services/api";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const state = ref("loading");
const errorMessage = ref("");

function sendToNative(payload) {
  if (typeof window === "undefined") return false;
  const bridge = window.uni?.webView || window.uni;
  if (typeof bridge?.postMessage === "function") {
    bridge.postMessage({ data: payload });
    return true;
  }
  return false;
}

async function createHandoff() {
  state.value = "loading";
  errorMessage.value = "";
  try {
    const payload = await apiRequest("/api/auth/mobile-handoff", {
      method: "POST",
      body: {},
    });
    if (!sendToNative({ type: "life-sequence-mobile-auth", code: payload.code })) {
      throw new Error("请从生命时序安卓应用打开此页面");
    }
    state.value = "complete";
  } catch (error) {
    errorMessage.value = error.message || "登录授权失败";
    state.value = "error";
  }
}

async function initialize() {
  await userStore.initialize({ force: true });
  state.value = userStore.isLoggedIn ? "ready" : "login";
  if (state.value === "ready") await createHandoff();
}

onMounted(initialize);
</script>

<template>
  <main class="mobile-auth-page">
    <AuthForm
      v-if="state === 'login'"
      :redirect-on-login="false"
      @authenticated="createHandoff"
    />
    <section v-else class="mobile-auth-status">
      <h1>生命时序</h1>
      <p v-if="state === 'loading' || state === 'ready'">正在验证并连接安卓应用...</p>
      <p v-else-if="state === 'complete'">登录成功，正在返回应用。</p>
      <template v-else>
        <p>{{ errorMessage }}</p>
        <button type="button" @click="createHandoff">重新连接</button>
      </template>
    </section>
  </main>
</template>

<style scoped>
.mobile-auth-page{min-height:100vh;background:#f3f7f4}.mobile-auth-status{display:grid;place-content:center;gap:12px;min-height:100vh;padding:32px;text-align:center;color:#263c33}.mobile-auth-status h1,.mobile-auth-status p{margin:0}.mobile-auth-status button{justify-self:center;padding:10px 16px;border:0;border-radius:6px;background:#20725e;color:#fff;font:inherit}
</style>
