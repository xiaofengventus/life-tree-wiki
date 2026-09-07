import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { apiRequest } from "@/services/api";

export const useUserStore = defineStore("user", () => {
  const user = ref(null);
  const initialized = ref(false);
  const initializing = ref(null);
  const lastError = ref("");
  const authConfig = ref(null);

  const roleLabels = {
    GUEST: "未注册",
    USER: "普通用户",
    ADMIN: "平台推荐管理员",
    COOPERATOR: "合作社团",
  };
  const permissions = {
    GUEST: ["read", "create_local_draft"],
    USER: ["read", "create_article", "edit_own_article", "delete_own_article"],
    ADMIN: [
      "read",
      "create_article",
      "edit_own_article",
      "delete_own_article",
      "nominate_platform_tree",
      "review_platform_recommendation",
    ],
    COOPERATOR: ["read", "create_article", "edit_own_article", "delete_own_article"],
  };

  const role = computed(() => user.value?.role || "GUEST");
  const isLoggedIn = computed(() => initialized.value && Boolean(user.value?.id));
  const isSiteOwner = computed(() =>
    Boolean(user.value?.isSiteOwner || user.value?.uid === "U000001"),
  );
  const currentType = computed(() =>
    isSiteOwner.value ? "站点所有者" : (roleLabels[role.value] || roleLabels.GUEST),
  );
  const currentPermissions = computed(() => permissions[role.value] || permissions.GUEST);

  function hasPermission(permission) {
    return currentPermissions.value.includes(permission);
  }

  function hasSessionHint() {
    return typeof document !== "undefined" && /(?:^|;\s*)life_auth_hint=1(?:;|$)/.test(document.cookie);
  }

  async function initialize({ force = false } = {}) {
    if (initialized.value && !force) return true;
    if (initializing.value && !force) return initializing.value;
    if (!force && !hasSessionHint()) {
      user.value = null;
      initialized.value = true;
      return true;
    }
    initializing.value = (async () => {
      try {
        const payload = await apiRequest("/api/auth/me");
        user.value = payload.user || null;
        lastError.value = "";
        return true;
      } catch (error) {
        user.value = null;
        lastError.value = error.message;
        return false;
      } finally {
        initialized.value = true;
        initializing.value = null;
      }
    })();
    return initializing.value;
  }

  async function loadAuthConfig() {
    try {
      authConfig.value = await apiRequest("/api/auth/config");
      lastError.value = "";
      return true;
    } catch (error) {
      authConfig.value = null;
      lastError.value = error.message;
      return false;
    }
  }

  async function login(username, password, turnstileToken) {
    try {
      const payload = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { username, password, turnstileToken },
        timeout: 30000,
      });
      user.value = payload.user;
      initialized.value = true;
      lastError.value = "";
      return true;
    } catch (error) {
      user.value = null;
      lastError.value = error.message;
      return false;
    }
  }

  async function register(userData) {
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: userData,
        timeout: 30000,
      });
      lastError.value = "";
      return true;
    } catch (error) {
      lastError.value = error.message;
      return false;
    }
  }

  async function logout() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn("服务端退出失败，本地会话状态仍会清除", error);
    } finally {
      user.value = null;
      initialized.value = true;
    }
  }

  async function updateProfile(profileData) {
    try {
      const payload = await apiRequest("/api/user/profile", {
        method: "PUT",
        body: profileData,
      });
      user.value = payload.user;
      lastError.value = "";
      return true;
    } catch (error) {
      lastError.value = error.message;
      return false;
    }
  }

  return {
    user,
    initialized,
    lastError,
    authConfig,
    roleLabels,
    permissions,
    role,
    isLoggedIn,
    isSiteOwner,
    currentType,
    currentPermissions,
    hasPermission,
    initialize,
    loadAuthConfig,
    login,
    register,
    logout,
    updateProfile,
  };
});
