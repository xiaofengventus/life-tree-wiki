<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import TurnstileWidget from "@/components/TurnstileWidget.vue";

const router = useRouter();
const userStore = useUserStore();
const props = defineProps({
  redirectOnLogin: { type: Boolean, default: true },
});
const emit = defineEmits(["authenticated"]);
const isLoginMode = ref(true);
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const name = ref("");
const introduce = ref("");
const inviteCode = ref("");
const turnstileToken = ref("");
const errorMessage = ref("");
const submitting = ref(false);
const turnstile = ref(null);
const inviteWasPrefilled = ref(false);

const passwordMatch = computed(() => password.value === confirmPassword.value);
const config = computed(() => userStore.authConfig || {});
const verificationReady = computed(
  () => Boolean(turnstileToken.value) || config.value.insecureDevelopmentMode === true,
);

async function handleSubmit() {
  errorMessage.value = "";
  if (!username.value || !password.value) {
    errorMessage.value = "请输入用户名和密码";
    return;
  }
  if (!verificationReady.value) {
    errorMessage.value = "请完成人机验证";
    return;
  }

  submitting.value = true;
  try {
    if (isLoginMode.value) {
      const success = await userStore.login(username.value, password.value, turnstileToken.value);
      if (success) {
        emit("authenticated", userStore.user);
        if (!props.redirectOnLogin) return;
        const redirect = String(router.currentRoute.value.query.redirect || "/");
        await router.push(redirect.startsWith("/") ? redirect : "/");
        return;
      }
    } else {
      if (!confirmPassword.value || !name.value || !inviteCode.value) {
        errorMessage.value = "请填写所有必填项，包括邀请码";
        return;
      }
      if (!passwordMatch.value) {
        errorMessage.value = "两次输入的密码不一致";
        return;
      }
      const success = await userStore.register({
        username: username.value,
        password: password.value,
        name: name.value,
        introduce: introduce.value,
        inviteCode: inviteCode.value,
        turnstileToken: turnstileToken.value,
      });
      if (success) {
        isLoginMode.value = true;
        errorMessage.value = "注册成功，请登录";
        password.value = "";
        confirmPassword.value = "";
        name.value = "";
        introduce.value = "";
        inviteCode.value = "";
        inviteWasPrefilled.value = false;
        return;
      }
    }
    errorMessage.value = userStore.lastError || "请求失败，请重试";
  } finally {
    submitting.value = false;
    turnstileToken.value = "";
    turnstile.value?.reset();
  }
}

function toggleMode() {
  isLoginMode.value = !isLoginMode.value;
  errorMessage.value = "";
  password.value = "";
  confirmPassword.value = "";
  name.value = "";
  introduce.value = "";
  inviteCode.value = "";
  inviteWasPrefilled.value = false;
  turnstileToken.value = "";
  turnstile.value?.reset();
}

onMounted(async () => {
  if (typeof window !== "undefined" && window.location.hash.startsWith("#invite=")) {
    const parameters = new URLSearchParams(window.location.hash.slice(1));
    const sharedToken = parameters.get("invite")?.trim();
    if (sharedToken) {
      inviteCode.value = sharedToken;
      inviteWasPrefilled.value = true;
      isLoginMode.value = false;
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }
  const loaded = await userStore.loadAuthConfig();
  if (!loaded) errorMessage.value = userStore.lastError;
});
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>生命时序</h2>
        <p>{{ isLoginMode ? "欢迎回来" : "使用邀请码创建账户" }}</p>
      </div>
      <div v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="auth-username">用户名</label>
          <input id="auth-username" v-model.trim="username" autocomplete="username" minlength="3" maxlength="32" required />
        </div>
        <div class="form-group">
          <label for="auth-password">密码</label>
          <input id="auth-password" v-model="password" type="password" :autocomplete="isLoginMode ? 'current-password' : 'new-password'" minlength="12" maxlength="128" required />
          <small v-if="!isLoginMode">至少 12 位，并同时包含文字和数字</small>
        </div>
        <div v-if="!isLoginMode" class="form-group">
          <label for="auth-confirm-password">确认密码</label>
          <input id="auth-confirm-password" v-model="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" :class="{ error: confirmPassword && !passwordMatch }" required />
        </div>
        <div v-if="!isLoginMode" class="form-group">
          <label for="auth-name">昵称</label>
          <input id="auth-name" v-model.trim="name" maxlength="40" required />
        </div>
        <div v-if="!isLoginMode" class="form-group">
          <label for="auth-introduce">个人简介</label>
          <textarea id="auth-introduce" v-model="introduce" maxlength="500" rows="3"></textarea>
        </div>
        <div v-if="!isLoginMode" class="form-group">
          <label for="auth-invite">邀请码</label>
          <input id="auth-invite" v-model.trim="inviteCode" autocomplete="off" minlength="8" maxlength="100" required />
          <small>{{ inviteWasPrefilled ? "已从管理员注册链接安全填入" : "支持一次性邀请码或多人注册链接密钥" }}</small>
        </div>
        <TurnstileWidget
          v-if="config.turnstileSiteKey || config.insecureDevelopmentMode"
          ref="turnstile"
          :site-key="config.turnstileSiteKey || ''"
          :development-mode="config.insecureDevelopmentMode === true"
          @verified="turnstileToken = $event"
          @expired="turnstileToken = ''"
          @error="errorMessage = '人机验证加载失败，请刷新页面'"
        />
        <p v-else class="configuration-error">服务器尚未配置人机验证，认证功能已安全关闭。</p>
        <button type="submit" class="submit-btn" :disabled="submitting || !verificationReady">
          {{ submitting ? "处理中……" : isLoginMode ? "登录" : "注册" }}
        </button>
      </form>
      <div class="toggle-link">
        {{ isLoginMode ? "还没有账户？" : "已有账户？" }}
        <button type="button" @click="toggleMode">{{ isLoginMode ? "使用邀请码注册" : "立即登录" }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #fff; padding: 100px 20px; }
.login-card { width: 100%; max-width: 430px; padding: 40px; border-radius: 16px; background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.22); }
.login-header { text-align: center; margin-bottom: 28px; }
.login-header h2 { margin: 0 0 8px; color: #333; font-size: 2rem; }
.login-header p, .toggle-link { color: #666; }
.error-message, .configuration-error { padding: 10px 15px; border-radius: 6px; background: #fee2e2; color: #b91c1c; font-size: .9rem; }
.form-group { margin-bottom: 18px; }
.form-group label, .form-group small { display: block; }
.form-group label { margin-bottom: 6px; color: #333; font-weight: 500; }
.form-group small { margin-top: 5px; color: #64748b; }
.form-group input, .form-group textarea { box-sizing: border-box; width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font: inherit; }
.form-group input:focus, .form-group textarea:focus { border-color: #667eea; outline: 2px solid rgba(102,126,234,.15); }
.form-group input.error { border-color: #dc2626; }
.submit-btn { width: 100%; margin-top: 10px; padding: 14px; border: 0; border-radius: 8px; color: #fff; background: linear-gradient(135deg,#667eea,#764ba2); font: inherit; font-weight: 600; cursor: pointer; }
.submit-btn:disabled { cursor: not-allowed; opacity: .55; }
.toggle-link { margin-top: 20px; text-align: center; }
.toggle-link button { border: 0; background: none; color: #667eea; cursor: pointer; font-weight: 600; }
@media (max-width: 520px) { .login-card { padding: 28px 20px; box-shadow: none; } }
</style>
