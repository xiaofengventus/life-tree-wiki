import { ApiRequestError } from "@/services/api";
import { clonePlainData } from "@/utils/plainData";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 1.8 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const DATA_IMAGE_PATTERN = /^data:image\/(?:png|jpe?g|webp);base64,/i;

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function imageElement(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取图片内容"));
    };
    image.src = url;
  });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("图片读取失败"));
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(value) {
  const dataUrl = String(value || "");
  if (!DATA_IMAGE_PATTERN.test(dataUrl)) throw new Error("本地图片格式无效");
  const comma = dataUrl.indexOf(",");
  const mimeType = dataUrl.slice(5, dataUrl.indexOf(";", 5)).toLowerCase();
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

export async function prepareImageBlob(source, { allowSvg = false } = {}) {
  if (!(source instanceof Blob) || !source.size) throw new Error("请选择有效的图片文件");
  if (source.size > MAX_SOURCE_BYTES) throw new Error("原始图片不能超过 25MB");
  const allowedPattern = allowSvg
    ? /^image\/(?:png|jpe?g|webp|gif|svg\+xml)$/i
    : /^image\/(?:png|jpe?g|webp|gif)$/i;
  if (!allowedPattern.test(source.type || "")) {
    throw new Error("只支持 JPEG、PNG、WebP 或 GIF；GIF 将转为静态 WebP");
  }

  const image = await imageElement(source);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) throw new Error("无法获取图片尺寸");
  let scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  let output = null;
  let width = 0;
  let height = 0;

  for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
    width = Math.max(1, Math.round(sourceWidth * scale));
    height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("浏览器无法压缩图片");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);
    for (const quality of [0.86, 0.78, 0.7, 0.62]) {
      output = await canvasBlob(canvas, "image/webp", quality);
      if (output && output.size <= MAX_OUTPUT_BYTES) break;
    }
    if (output && output.size <= MAX_OUTPUT_BYTES) break;
    scale *= 0.8;
  }
  if (!output || output.size > MAX_OUTPUT_BYTES) {
    throw new Error("图片压缩后仍超过 1.8MB，请先裁剪或降低分辨率");
  }
  return { blob: output, width, height, dataUrl: await blobToDataUrl(output) };
}

export async function prepareCanvasImage(canvas, { quality = 0.88 } = {}) {
  if (!(canvas instanceof HTMLCanvasElement) || !canvas.width || !canvas.height) {
    throw new Error("裁剪结果无效，请重新选择图片");
  }
  let output = null;
  for (const candidate of [quality, 0.8, 0.72, 0.64]) {
    output = await canvasBlob(canvas, "image/webp", candidate);
    if (output && output.size <= MAX_OUTPUT_BYTES) break;
  }
  if (!output || output.size > MAX_OUTPUT_BYTES) {
    throw new Error("裁剪后的图片仍超过 1.8MB，请缩小裁剪区域后重试");
  }
  return {
    blob: output,
    width: canvas.width,
    height: canvas.height,
    dataUrl: await blobToDataUrl(output),
  };
}

export async function uploadPreparedImage(prepared) {
  const response = await fetch("/api/media", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": prepared.blob.type || "image/webp",
      "X-Image-Width": String(prepared.width),
      "X-Image-Height": String(prepared.height),
    },
    body: prepared.blob,
  });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) {
    throw new ApiRequestError(
      payload?.error || `图片上传失败（${response.status}）`,
      response.status,
      payload?.code || "MEDIA_UPLOAD_FAILED",
    );
  }
  return payload.image;
}

export async function preparedFromDataUrl(dataUrl) {
  const blob = dataUrlToBlob(dataUrl);
  const image = await imageElement(blob);
  return {
    blob,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };
}

async function uploadUniqueSources(sources, onProgress) {
  const uniqueSources = [...new Set(sources)];
  const uploaded = new Map();
  let cursor = 0;
  let completed = 0;
  async function worker() {
    while (cursor < uniqueSources.length) {
      const index = cursor;
      cursor += 1;
      const source = uniqueSources[index];
      const image = await uploadPreparedImage(await preparedFromDataUrl(source));
      uploaded.set(source, image);
      completed += 1;
      onProgress(completed, uniqueSources.length);
    }
  }
  onProgress(0, uniqueSources.length);
  await Promise.all(Array.from(
    { length: Math.min(3, uniqueSources.length) },
    () => worker(),
  ));
  return uploaded;
}

export async function uploadHtmlDataImages(html, onProgress = () => {}) {
  const documentNode = new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html");
  const images = [...documentNode.body.querySelectorAll("img")]
    .filter((image) => DATA_IMAGE_PATTERN.test(image.getAttribute("src") || ""));
  const uploaded = await uploadUniqueSources(
    images.map((image) => image.getAttribute("src")),
    onProgress,
  );
  for (const element of images) {
    element.setAttribute("src", uploaded.get(element.getAttribute("src")).url);
  }
  return documentNode.body.innerHTML;
}

export async function uploadTreeDataImages(value, onProgress = () => {}) {
  // Vue 会把编辑中的树包装为 Proxy；浏览器的 structuredClone 无法复制 Proxy。
  // 树文档本来就是 JSON 格式，先序列化可安全解除响应式包装。
  const document = clonePlainData(value, "进化树");
  const nodes = [];
  function collect(node) {
    if (!node) return;
    if (DATA_IMAGE_PATTERN.test(node.data?.image || "")) nodes.push(node);
    (node.children || []).forEach(collect);
  }
  collect(document.root);
  const uploaded = await uploadUniqueSources(nodes.map((node) => node.data.image), onProgress);
  for (const node of nodes) {
    const image = uploaded.get(node.data.image);
    node.data.image = image.url;
    node.data.imageSize = {
      width: node.data.imageSize?.width || image.width,
      height: node.data.imageSize?.height || image.height,
      custom: Boolean(node.data.imageSize?.custom),
    };
  }
  return document;
}

export function countLocalTreeImages(root) {
  let count = 0;
  (function visit(node) {
    if (!node) return;
    if (DATA_IMAGE_PATTERN.test(node.data?.image || "")) count += 1;
    (node.children || []).forEach(visit);
  })(root);
  return count;
}
