import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { saveDraft } from "@/services/drafts";
import {
  createDraftSnapshot,
  DRAFT_SAVE_MODE_KEY,
  normalizeDraftSaveMode,
} from "@/utils/draftSnapshots";

export function useDraftAutosave({
  source,
  buildDraft,
  delay = 1200,
}) {
  const draftId = ref("");
  const status = ref("idle");
  const lastSavedAt = ref("");
  const errorMessage = ref("");
  const isDirty = ref(false);
  const saveMode = ref("auto");
  let ready = false;
  let timer = 0;
  let saving = null;
  let saveAgain = false;
  let savedSnapshot = "";
  let needsBaseline = true;

  function currentSnapshot() {
    return createDraftSnapshot(source());
  }

  function idleStatus() {
    return draftId.value ? "saved" : "idle";
  }

  function updateDirtyState() {
    if (!ready || needsBaseline) return false;
    const changed = currentSnapshot() !== savedSnapshot;
    isDirty.value = changed;
    if (!changed) {
      status.value = idleStatus();
      errorMessage.value = "";
    } else if (status.value !== "saving" && status.value !== "error") {
      status.value = saveMode.value === "auto" ? "pending" : "dirty";
    }
    return changed;
  }

  function scheduleTimer() {
    window.clearTimeout(timer);
    timer = 0;
    if (!ready || !isDirty.value || saveMode.value !== "auto") return;
    timer = window.setTimeout(() => {
      saveNow().catch(() => {});
    }, delay);
  }

  async function saveNow() {
    window.clearTimeout(timer);
    timer = 0;
    if (!ready) return null;
    if (!updateDirtyState()) return null;
    if (saving) {
      saveAgain = true;
      return saving;
    }
    const snapshotToSave = currentSnapshot();
    const input = await buildDraft(draftId.value);
    if (!input) return null;
    status.value = "saving";
    errorMessage.value = "";
    saving = saveDraft({ ...input, id: draftId.value || input.id })
      .then((saved) => {
        draftId.value = saved.id;
        lastSavedAt.value = saved.updatedAt;
        savedSnapshot = snapshotToSave;
        const changedDuringSave = currentSnapshot() !== savedSnapshot;
        isDirty.value = changedDuringSave;
        status.value = changedDuringSave
          ? saveMode.value === "auto" ? "pending" : "dirty"
          : "saved";
        if (changedDuringSave && saveMode.value === "auto") scheduleTimer();
        return saved;
      })
      .catch((error) => {
        status.value = "error";
        errorMessage.value = error.message || "草稿保存失败";
        isDirty.value = currentSnapshot() !== savedSnapshot;
        throw error;
      })
      .finally(async () => {
        saving = null;
        if (saveAgain) {
          saveAgain = false;
          await saveNow().catch(() => {});
        }
      });
    return saving;
  }

  function scheduleSave() {
    if (!ready || needsBaseline) return;
    updateDirtyState();
    scheduleTimer();
  }

  function setReady(value = true) {
    ready = value;
    if (!value) {
      window.clearTimeout(timer);
      timer = 0;
      return;
    }
    if (needsBaseline) {
      savedSnapshot = currentSnapshot();
      needsBaseline = false;
      isDirty.value = false;
      status.value = idleStatus();
      errorMessage.value = "";
    }
  }

  function setDraft(draft) {
    draftId.value = draft?.id || "";
    lastSavedAt.value = draft?.updatedAt || "";
    status.value = draft?.id ? "saved" : "idle";
    errorMessage.value = "";
    isDirty.value = false;
    savedSnapshot = "";
    needsBaseline = true;
  }

  function setSaveMode(value) {
    saveMode.value = normalizeDraftSaveMode(value);
    try {
      window.localStorage.setItem(DRAFT_SAVE_MODE_KEY, saveMode.value);
    } catch {
      // 浏览器拒绝持久化偏好时，当前页面仍然可以正常切换。
    }
    if (!ready) return;
    updateDirtyState();
    if (saveMode.value === "auto") scheduleTimer();
    else {
      window.clearTimeout(timer);
      timer = 0;
    }
  }

  const stopWatching = watch(source, scheduleSave, {
    deep: true,
    flush: "post",
  });

  function handleVisibilityChange() {
    if (document.visibilityState === "hidden" && saveMode.value === "auto") {
      saveNow().catch(() => {});
    }
  }

  function handlePageHide() {
    if (saveMode.value === "auto") saveNow().catch(() => {});
  }

  function handleBeforeUnload(event) {
    if (!updateDirtyState()) return;
    event.preventDefault();
    event.returnValue = "";
  }

  function handleSaveShortcut(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== "s") {
      return;
    }
    event.preventDefault();
    saveNow().catch(() => {});
  }

  onMounted(() => {
    let storedMode = "auto";
    try {
      storedMode = window.localStorage.getItem(DRAFT_SAVE_MODE_KEY);
    } catch {}
    setSaveMode(storedMode);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleSaveShortcut);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("keydown", handleSaveShortcut);
    window.clearTimeout(timer);
    stopWatching();
    if (saveMode.value === "auto") saveNow().catch(() => {});
  });

  const canSave = computed(() =>
    isDirty.value && status.value !== "saving");

  return {
    draftId,
    status,
    lastSavedAt,
    errorMessage,
    isDirty,
    canSave,
    saveMode,
    saveNow,
    scheduleSave,
    setDraft,
    setReady,
    setSaveMode,
  };
}
