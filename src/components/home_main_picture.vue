<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { fetchHomeGallery } from "@/services/media";
import fallbackPicture from "@/assets/pic/jmgmksz-fox.png";

const fallbackImage = {
  hash: "bundled-home-picture",
  url: fallbackPicture,
  width: 1600,
  height: 900,
};
const images = ref([fallbackImage]);
const activeIndex = ref(0);
let autoplayTimer;
let touchStartX = 0;

const hasMultipleImages = computed(() => images.value.length > 1);
const activeImage = computed(() => images.value[activeIndex.value] || fallbackImage);
const previousImage = computed(() => {
  if (!hasMultipleImages.value) return null;
  return images.value[
    (activeIndex.value - 1 + images.value.length) % images.value.length
  ];
});
const nextImage = computed(() => {
  if (!hasMultipleImages.value) return null;
  return images.value[(activeIndex.value + 1) % images.value.length];
});

function goTo(index) {
  if (!images.value.length) return;
  activeIndex.value = (index + images.value.length) % images.value.length;
}

function previous() {
  goTo(activeIndex.value - 1);
}

function next() {
  goTo(activeIndex.value + 1);
}

function stopAutoplay() {
  window.clearInterval(autoplayTimer);
}

function startAutoplay() {
  stopAutoplay();
  if (
    !hasMultipleImages.value ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  autoplayTimer = window.setInterval(next, 6500);
}

function onKeydown(event) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previous();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    next();
  }
}

function onTouchStart(event) {
  touchStartX = event.changedTouches?.[0]?.clientX || 0;
}

function onTouchEnd(event) {
  const endX = event.changedTouches?.[0]?.clientX || 0;
  const distance = endX - touchStartX;
  if (Math.abs(distance) < 45) return;
  distance > 0 ? previous() : next();
}

async function loadGallery() {
  try {
    const payload = await fetchHomeGallery();
    if (Array.isArray(payload.images) && payload.images.length) {
      images.value = payload.images;
      activeIndex.value = 0;
    }
  } catch (error) {
    console.warn("首页画册加载失败，继续使用默认主图", error);
  } finally {
    startAutoplay();
  }
}

onMounted(loadGallery);
onBeforeUnmount(stopAutoplay);
</script>

<template>
  <section
    class="home-album"
    aria-label="首页精选画册"
    tabindex="0"
    @keydown="onKeydown"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
    @focusin="stopAutoplay"
    @focusout="startAutoplay"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <div class="album-shell">
      <button
        class="album-peek previous"
        type="button"
        :disabled="!hasMultipleImages"
        aria-label="上一张图片"
        @click="previous"
      >
        <img
          v-if="previousImage"
          :src="previousImage.url"
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      </button>

      <figure class="album-page">
        <Transition name="album-fade" mode="out-in">
          <img
            :key="activeImage.hash"
            :src="activeImage.url"
            :alt="`首页精选画册第 ${activeIndex + 1} 张图片`"
            :width="activeImage.width"
            :height="activeImage.height"
            draggable="false"
          />
        </Transition>
        <figcaption v-if="hasMultipleImages">
          {{ String(activeIndex + 1).padStart(2, "0") }}
          <span>/</span>
          {{ String(images.length).padStart(2, "0") }}
        </figcaption>
      </figure>

      <button
        class="album-peek next"
        type="button"
        :disabled="!hasMultipleImages"
        aria-label="下一张图片"
        @click="next"
      >
        <img
          v-if="nextImage"
          :src="nextImage.url"
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      </button>
    </div>

    <nav v-if="hasMultipleImages" class="album-pagination" aria-label="选择画册图片">
      <button
        v-for="(image, index) in images"
        :key="image.hash"
        type="button"
        :class="{ active: index === activeIndex }"
        :aria-label="`显示第 ${index + 1} 张图片`"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="goTo(index)"
      ></button>
    </nav>
  </section>
</template>

<style scoped>
.home-album {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: calc(100svh - 64px);
  min-height: 420px;
  margin: 64px 0 0;
  outline: none;
}

.album-shell {
  display: grid;
  width: 100%;
  height: 100%;
  overflow: hidden;
  grid-template-columns: clamp(30px, 4vw, 62px) minmax(0, 1fr) clamp(30px, 4vw, 62px);
  background: #f4f4f2;
}

.album-page {
  position: relative;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  margin: 0;
  background: #f4f4f2;
}

.album-page > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-page figcaption {
  position: absolute;
  right: 18px;
  bottom: 15px;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  background: rgba(27, 22, 34, 0.55);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  backdrop-filter: blur(8px);
}

.album-page figcaption span {
  margin: 0 3px;
  opacity: 0.55;
}

.album-peek {
  position: relative;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: #ffffff;
  cursor: pointer;
}

.album-peek:disabled {
  cursor: default;
}

.album-peek img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.78) brightness(0.84);
  transition: filter 0.25s ease, transform 0.35s ease;
}

.album-peek.previous img {
  object-position: 100% 50%;
}

.album-peek.next img {
  object-position: 0 50%;
}

.album-peek:not(:disabled):hover img {
  filter: saturate(1) brightness(1);
  transform: scale(1.05);
}

.album-pagination {
  position: absolute;
  z-index: 4;
  bottom: 17px;
  left: 50%;
  display: flex;
  justify-content: center;
  gap: 7px;
  margin: 0;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(20, 27, 25, 0.22);
  transform: translateX(-50%);
  backdrop-filter: blur(8px);
}

.album-pagination button {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: width 0.25s ease, background 0.25s ease;
}

.album-pagination button.active {
  width: 28px;
  background: #ffffff;
}

.album-fade-enter-active,
.album-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.album-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.album-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@media (max-width: 700px) {
  .home-album {
    width: 100%;
    height: calc(100svh - 64px);
    min-height: 360px;
    margin: 64px 0 0;
  }

  .album-shell {
    grid-template-columns: 24px minmax(0, 1fr) 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .album-fade-enter-active,
  .album-fade-leave-active,
  .album-peek img {
    transition: none;
  }
}
</style>
