<script setup>
import { onMounted, ref } from "vue";
import AuthForm from "@/components/AuthForm.vue";
import NavBar from "@/components/navBar.vue";
import { apiRequest } from "@/services/api";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const state = ref("loading");
const errorMessage = ref("");
const code = ref("");
const codeExpiresAt = ref("");
const copied = ref(false);
const sentToBridge = ref(false);

async function copyCode() {
  try {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // 剪贴板不可用时退化为选中提示
    window.alert("复制失败，请手动长按选中复制：" + code.value);
  }
}

function sendToNative(payload) {
  // 仅尽力而为：部分手机浏览器内核会注入假的 window.uni，
  // 所以桥发送结果不作为跳转/展示依据——浏览器端一律直接显示验证码。
  if (typeof window === "undefined") return false;
  const bridge = window.uni?.webView || window.uni;
  if (typeof bridge?.postMessage === "function") {
    try {
      bridge.postMessage({ data: payload });
      return true;
    } catch {
      return false;
    }
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
    sentToBridge.value = sendToNative({ type: "life-sequence-mobile-auth", code: payload.code });
    // 浏览器兜底：直接展示一次性 code 供复制
    // （code 60 秒有效；粘贴进 App 的登录框即可换取会话）
    code.value = String(payload.code || "");
    codeExpiresAt.value = payload.expiresAt || "";
    state.value = "manual";
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
  <div class="mobile-auth-shell">
    <NavBar />
    <main class="mobile-auth-page">
      <AuthForm
        v-if="state === 'login'"
        :redirect-on-login="false"
        @authenticated="createHandoff"
      />
      <section v-else class="mobile-auth-status">
        <h1>生命时序</h1>
        <p v-if="state === 'loading' || state === 'ready'">正在验证并连接安卓应用...</p>
        <template v-else-if="state === 'manual'">
          <h2 style="margin:0;font-size:18px">移动端登录码</h2>
          <p>把下面的验证码粘贴到 App 的「账号」页登录框（60 秒内有效）：</p>
          <code class="handoff-code">{{ code }}</code>
          <p v-if="sentToBridge" style="font-size:12px;color:#687a70">
            已尝试唤起应用；若 App 没有反应，请复制验证码手动粘贴。
          </p>
          <button type="button" @click="copyCode">{{ copied ? "已复制 ✓" : "复制验证码" }}</button>
          <p style="font-size:12px;color:#687a70">换一个码请刷新页面。验证码一次性使用，泄露无关紧要（60 秒即失效）。</p>
        </template>
        <template v-else>
          <p>{{ errorMessage }}</p>
          <button type="button" @click="createHandoff">重新连接</button>
        </template>
      </section>
    </main>
  </div>
</template>

<style scoped>
.mobile-auth-shell{display:flex;flex-direction:column;min-height:100vh}
.mobile-auth-page{flex:1;min-height:0;background:#f3f7f4}
.mobile-auth-status{display:grid;place-content:center;gap:12px;min-height:calc(100vh - 64px);padding:32px;text-align:center;color:#263c33}.mobile-auth-status h1,.mobile-auth-status p{margin:0}.mobile-auth-status button{justify-self:center;padding:10px 16px;border:0;border-radius:6px;background:#20725e;color:#fff;font:inherit}
.handoff-code{display:inline-block;max-width:92vw;padding:10px 14px;border:1px dashed #20725e;border-radius:6px;background:#fff;font-family:Consolas,monospace;font-size:14px;word-break:break-all;user-select:all}
</style>
