<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  siteKey: { type: String, default: "" },
  developmentMode: { type: Boolean, default: false },
});
const emit = defineEmits(["verified", "expired", "error"]);
const container = ref(null);
let widgetId = null;

function loadTurnstile() {
  if (globalThis.turnstile) return Promise.resolve(globalThis.turnstile);
  if (globalThis.__lifeTurnstilePromise) return globalThis.__lifeTurnstilePromise;
  globalThis.__lifeTurnstilePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(globalThis.turnstile);
    script.onerror = () => reject(new Error("Turnstile 加载失败"));
    document.head.append(script);
  });
  return globalThis.__lifeTurnstilePromise;
}

async function renderWidget() {
  if (props.developmentMode) {
    emit("verified", "development-bypass");
    return;
  }
  if (!props.siteKey || !container.value) return;
  try {
    const turnstile = await loadTurnstile();
    await nextTick();
    if (!container.value) return;
    if (widgetId !== null) turnstile.remove(widgetId);
    widgetId = turnstile.render(container.value, {
      sitekey: props.siteKey,
      callback: (token) => emit("verified", token),
      "expired-callback": () => emit("expired"),
      "error-callback": () => emit("error"),
      theme: "auto",
    });
  } catch (error) {
    console.error(error);
    emit("error");
  }
}

function reset() {
  if (props.developmentMode) {
    emit("verified", "development-bypass");
  } else if (widgetId !== null && globalThis.turnstile) {
    globalThis.turnstile.reset(widgetId);
  }
}

watch(() => [props.siteKey, props.developmentMode], renderWidget);
onMounted(renderWidget);
onBeforeUnmount(() => {
  if (widgetId !== null && globalThis.turnstile) globalThis.turnstile.remove(widgetId);
});
defineExpose({ reset });
</script>

<template>
  <div v-if="developmentMode" class="development-notice">本地开发验证模式</div>
  <div v-else ref="container" class="turnstile-container"></div>
</template>

<style scoped>
.turnstile-container { min-height: 65px; margin: 4px 0 12px; }
.development-notice { margin: 4px 0 12px; color: #92400e; font-size: 0.85rem; }
</style>
