import { useUserStore } from "@/stores/user";

export function navigateWithAuth(targetPath, router, fallbackPath = "/login") {
  const userStore = useUserStore();

  if (userStore.isLoggedIn) {
    router.push(targetPath);
  } else {
    router.push(fallbackPath);
  }
}

export function goHome(router) {
  router.push("/");
}

export async function requireAuth(to, from, next) {
  const userStore = useUserStore();
  await userStore.initialize();
  const requiresAuth = to.meta?.requiresAuth === true;

  if (requiresAuth && !userStore.isLoggedIn) {
    next({ name: "login", query: { redirect: to.fullPath } });
  } else if (to.meta?.siteOwnerOnly === true && !userStore.isSiteOwner) {
    next({ name: "home" });
  } else if (
    Array.isArray(to.meta?.roles) &&
    !userStore.isSiteOwner &&
    !to.meta.roles.includes(userStore.role)
  ) {
    next({ name: "home" });
  } else {
    next();
  }
}
