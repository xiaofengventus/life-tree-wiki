import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";

export function useCheckTrans() {
  const router = useRouter();
  const userStore = useUserStore();

  function goToHome() {
    router.push("/");
  }

  function goToResearch() {
    // if (userStore.isLoggedIn) {
    //   router.push("/research");
    // } else {
    //   router.push("/login");
    // }
    router.push("/research");
  }

  function goToWorkplace() {
    // if (userStore.isLoggedIn) {
    //   router.push("/workplace");
    // } else {
    //   router.push("/login");
    // }
    router.push("/workplace");
  }

  function goToUserSpace() {
    if (userStore.isLoggedIn) {
      router.push("/user-space");
    } else {
      router.push("/login");
    }
  }

  function canCreatePost() {
    return userStore.isLoggedIn && userStore.hasPermission("create_article");
  }

  function goToCreatePost() {
    if (!canCreatePost()) return false;

    router.push("/create-post");
    return true;
  }

  return {
    goToHome,
    goToResearch,
    goToWorkplace,
    goToUserSpace,
    canCreatePost,
    goToCreatePost,
  };
}
