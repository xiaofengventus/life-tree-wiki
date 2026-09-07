<script setup>
import { nextTick, onBeforeUnmount, ref } from "vue";
import Cropper from "cropperjs";
import { prepareCanvasImage } from "@/utils/mediaImages";

const props = defineProps({
  title: { type: String, default: "裁剪图片" },
  aspectRatio: { type: Number, default: 1 },
  outputWidth: { type: Number, default: 512 },
  outputHeight: { type: Number, default: 512 },
  roundPreview: { type: Boolean, default: false },
});
const emit = defineEmits(["confirm"]);

const visible = ref(false);
const busy = ref(false);
const errorMessage = ref("");
const cropHost = ref(null);
let cropper = null;
let objectUrl = "";
let flippedX = 1;

function releaseCropper() {
  cropper?.destroy?.();
  cropper = null;
  cropHost.value?.replaceChildren();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = "";
  flippedX = 1;
}

async function open(file) {
  if (!(file instanceof Blob) || !file.size) return;
  if (file.size > 25 * 1024 * 1024) throw new Error("原始图片不能超过 25MB");
  if (!/^image\/(?:jpe?g|png|webp|gif)$/i.test(file.type || "")) {
    throw new Error("只支持 JPEG、PNG、WebP 或 GIF 图片");
  }
  releaseCropper();
  errorMessage.value = "";
  visible.value = true;
  objectUrl = URL.createObjectURL(file);
  await nextTick();

  const image = new Image();
  image.src = objectUrl;
  image.alt = props.title;
  cropper = new Cropper(image, { container: cropHost.value });
  const canvas = cropper.getCropperCanvas();
  const cropImage = cropper.getCropperImage();
  const selection = cropper.getCropperSelection();
  if (cropImage) cropImage.initialCenterSize = "cover";
  if (selection) {
    selection.aspectRatio = props.aspectRatio;
    selection.initialAspectRatio = props.aspectRatio;
    selection.initialCoverage = 0.78;
    selection.keyboard = true;
    if (props.roundPreview) selection.style.borderRadius = "50%";
    window.requestAnimationFrame(() => {
      cropImage?.$center?.("cover");
      selection.$reset?.();
    });
  }

  if (canvas && cropImage && selection) {
    cropImage.addEventListener("transform", (event) => {
      const canvasRect = canvas.getBoundingClientRect();
      const selectionRect = selection.getBoundingClientRect();
      const clone = cropImage.cloneNode();
      clone.style.transform = `matrix(${event.detail.matrix.join(",")})`;
      clone.style.opacity = "0";
      canvas.appendChild(clone);
      const imageRect = clone.getBoundingClientRect();
      clone.remove();
      if (
        imageRect.top > selectionRect.top ||
        imageRect.right < selectionRect.right ||
        imageRect.bottom < selectionRect.bottom ||
        imageRect.left > selectionRect.left ||
        selectionRect.left < canvasRect.left ||
        selectionRect.right > canvasRect.right ||
        selectionRect.top < canvasRect.top ||
        selectionRect.bottom > canvasRect.bottom
      ) event.preventDefault();
    });
    selection.addEventListener("change", (event) => {
      const canvasRect = canvas.getBoundingClientRect();
      const imageRect = cropImage.getBoundingClientRect();
      const next = event.detail;
      const left = canvasRect.left + next.x;
      const top = canvasRect.top + next.y;
      const right = left + next.width;
      const bottom = top + next.height;
      if (
        left < Math.max(canvasRect.left, imageRect.left) ||
        right > Math.min(canvasRect.right, imageRect.right) ||
        top < Math.max(canvasRect.top, imageRect.top) ||
        bottom > Math.min(canvasRect.bottom, imageRect.bottom)
      ) event.preventDefault();
    });
  }
}

function close() {
  if (busy.value) return;
  visible.value = false;
  releaseCropper();
}

function cropperImage() {
  return cropper?.getCropperImage?.();
}

function zoom(amount) {
  cropperImage()?.$zoom?.(amount);
}

function rotate(angle) {
  cropperImage()?.$rotate?.(`${angle}deg`);
}

function flipHorizontal() {
  flippedX *= -1;
  cropperImage()?.$scale?.(flippedX, 1);
}

function reset() {
  cropperImage()?.$resetTransform?.();
  cropper?.getCropperSelection?.()?.$reset?.();
  flippedX = 1;
}

async function confirmCrop() {
  const selection = cropper?.getCropperSelection?.();
  if (!selection) return;
  busy.value = true;
  errorMessage.value = "";
  try {
    const canvas = await selection.$toCanvas({
      width: props.outputWidth,
      height: props.outputHeight,
      beforeDraw(context) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
      },
    });
    const prepared = await prepareCanvasImage(canvas);
    emit("confirm", prepared);
    visible.value = false;
    releaseCropper();
  } catch (error) {
    errorMessage.value = error.message || "图片裁剪失败";
  } finally {
    busy.value = false;
  }
}

function onKeydown(event) {
  if (event.key === "Escape") close();
}

onBeforeUnmount(releaseCropper);
defineExpose({ open, close });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="crop-dialog-backdrop"
      role="presentation"
      @mousedown.self="close"
      @keydown="onKeydown"
    >
      <section class="crop-dialog" role="dialog" aria-modal="true" :aria-label="title">
        <header>
          <div>
            <h2>{{ title }}</h2>
            <p>拖动图片和裁剪框，滚轮或按钮可缩放。</p>
          </div>
          <button type="button" class="close-button" aria-label="关闭" :disabled="busy" @click="close">×</button>
        </header>

        <div ref="cropHost" class="crop-host" :class="{ 'round-crop': roundPreview }"></div>

        <div class="crop-tools" aria-label="图片调整工具">
          <button type="button" @click="zoom(0.1)">放大</button>
          <button type="button" @click="zoom(-0.1)">缩小</button>
          <button type="button" @click="rotate(-90)">左转 90°</button>
          <button type="button" @click="rotate(90)">右转 90°</button>
          <button type="button" @click="flipHorizontal">水平翻转</button>
          <button type="button" @click="reset">重置</button>
        </div>

        <p v-if="errorMessage" class="crop-error" role="alert">{{ errorMessage }}</p>
        <footer>
          <span>输出尺寸：{{ outputWidth }} × {{ outputHeight }}，自动转为 WebP</span>
          <div>
            <button type="button" class="cancel-button" :disabled="busy" @click="close">取消</button>
            <button type="button" class="confirm-button" :disabled="busy" @click="confirmCrop">
              {{ busy ? "处理中……" : "使用此图片" }}
            </button>
          </div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.crop-dialog-backdrop{position:fixed;z-index:2000;inset:0;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.72);backdrop-filter:blur(3px)}
.crop-dialog{width:min(100%,900px);max-height:calc(100vh - 36px);overflow:auto;border-radius:14px;background:#fff;box-shadow:0 24px 70px rgba(0,0,0,.35);color:#1e293b}
.crop-dialog>header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 22px;border-bottom:1px solid #e2e8f0}.crop-dialog h2{margin:0 0 4px;font-size:1.25rem}.crop-dialog header p{margin:0;color:#64748b;font-size:.88rem}.close-button{border:0;background:transparent;color:#64748b;font-size:2rem;line-height:1;cursor:pointer}
.crop-host{height:min(58vh,520px);min-height:340px;margin:18px;background:#111827;overflow:hidden}.crop-host :deep(cropper-canvas){width:100%;height:100%}.crop-host.round-crop :deep(cropper-selection){border-radius:50%}
.crop-tools{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:0 20px 16px}.crop-tools button,.crop-dialog footer button{padding:8px 13px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;cursor:pointer}.crop-tools button:hover{background:#f1f5f9}
.crop-error{margin:0 22px 12px;color:#b91c1c}.crop-dialog>footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 22px;border-top:1px solid #e2e8f0}.crop-dialog footer span{color:#64748b;font-size:.82rem}.crop-dialog footer div{display:flex;gap:8px}.crop-dialog footer .confirm-button{border-color:#2563eb;background:#2563eb;color:#fff}.crop-dialog button:disabled{opacity:.55;cursor:not-allowed}
@media(max-width:640px){.crop-dialog-backdrop{padding:0}.crop-dialog{max-height:100vh;border-radius:0}.crop-host{height:52vh;min-height:280px;margin:10px}.crop-dialog>footer{align-items:stretch;flex-direction:column}.crop-dialog footer div{justify-content:flex-end}}
</style>
