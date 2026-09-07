import JSZip from "jszip";
import { prepareImageBlob } from "@/utils/mediaImages";

function directChildrenByName(element, name) {
  return Array.from(element?.children || []).filter((child) => child.localName === name);
}

function mimeFromPath(path) {
  if (/\.png$/i.test(path)) return "image/png";
  if (/\.jpe?g$/i.test(path)) return "image/jpeg";
  if (/\.webp$/i.test(path)) return "image/webp";
  if (/\.gif$/i.test(path)) return "image/gif";
  if (/\.svg$/i.test(path)) return "image/svg+xml";
  return "";
}

async function sanitizedSvgBlob(file) {
  const parsed = new DOMParser().parseFromString(await file.async("string"), "image/svg+xml");
  if (parsed.querySelector("parsererror")) return null;
  parsed.querySelectorAll("script,foreignObject,iframe,object,embed").forEach((node) => node.remove());
  parsed.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || name === "href" || name === "xlink:href" ||
          (name === "style" && /url\s*\(/i.test(attribute.value))) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return new Blob([new XMLSerializer().serializeToString(parsed.documentElement)], {
    type: "image/svg+xml",
  });
}

function findZipResource(zip, source) {
  let path = String(source || "").trim();
  if (!path || /^https?:/i.test(path) || /^data:image\//i.test(path)) return null;
  try { path = decodeURIComponent(path); } catch { /* 保留原始资源名 */ }
  path = path.replace(/^xap:/i, "").replace(/^file:\/\//i, "").replace(/^\/+/, "");
  const basename = path.split("/").pop();
  const candidates = new Set([
    path,
    `resources/${basename}`,
    `attachments/${basename}`,
  ].map((value) => value.toLowerCase()));
  return Object.values(zip.files).find((entry) =>
    !entry.dir && candidates.has(entry.name.replace(/^\/+/, "").toLowerCase()),
  ) || null;
}

async function resolveImage(zip, imageSource, requestedWidth, requestedHeight) {
  const source = String(imageSource || "").trim();
  if (/^https:\/\//i.test(source) || /^data:image\/(?:png|jpe?g|webp);base64,/i.test(source)) {
    return {
      image: source,
      imageSize: {
        width: Number(requestedWidth) || 180,
        height: Number(requestedHeight) || 110,
        custom: Boolean(requestedWidth || requestedHeight),
      },
    };
  }
  const resource = findZipResource(zip, source);
  if (!resource) return {};
  const mimeType = mimeFromPath(resource.name);
  if (!mimeType) return {};
  let blob = mimeType === "image/svg+xml"
    ? await sanitizedSvgBlob(resource)
    : new Blob([await resource.async("arraybuffer")], { type: mimeType });
  if (!blob) return {};
  const prepared = await prepareImageBlob(blob, { allowSvg: mimeType === "image/svg+xml" });
  return {
    image: prepared.dataUrl,
    imageTitle: "XMind 导入图片",
    imageSize: {
      width: Number(requestedWidth) || prepared.width,
      height: Number(requestedHeight) || prepared.height,
      custom: Boolean(requestedWidth || requestedHeight),
    },
  };
}

function modernImage(topic) {
  const image = topic?.image || topic?.imageInfo || null;
  if (!image) return {};
  if (typeof image === "string") return { source: image };
  return {
    source: image.src || image.source || image.url,
    width: image.width,
    height: image.height,
  };
}

async function convertModernTopic(topic, zip) {
  const children = Array.isArray(topic?.children?.attached)
    ? await Promise.all(topic.children.attached.map((child) => convertModernTopic(child, zip)))
    : [];
  const image = modernImage(topic);
  return {
    data: {
      text: String(topic?.title ?? "").trim(),
      expand: true,
      ...(await resolveImage(zip, image.source, image.width, image.height)),
    },
    children,
  };
}

function legacyImage(topic) {
  const image = directChildrenByName(topic, "img")[0];
  if (!image) return {};
  return {
    source: image.getAttribute("src") || image.getAttribute("xhtml:src"),
    width: image.getAttribute("width"),
    height: image.getAttribute("height"),
  };
}

async function convertLegacyTopic(topic, zip) {
  const title = directChildrenByName(topic, "title")[0]?.textContent;
  const childrenContainer = directChildrenByName(topic, "children")[0];
  const attachedGroups = directChildrenByName(childrenContainer, "topics").filter(
    (group) => !group.getAttribute("type") || group.getAttribute("type") === "attached",
  );
  const childTopics = attachedGroups.flatMap((group) => directChildrenByName(group, "topic"));
  const image = legacyImage(topic);
  return {
    data: {
      text: String(title ?? "").trim(),
      expand: true,
      ...(await resolveImage(zip, image.source, image.width, image.height)),
    },
    children: await Promise.all(childTopics.map((child) => convertLegacyTopic(child, zip))),
  };
}

async function parseLegacyContent(xml, zip) {
  if (typeof DOMParser === "undefined") throw new Error("当前环境不支持解析 XMind 8 XML");
  const xmlDocument = new DOMParser().parseFromString(xml, "application/xml");
  if (xmlDocument.querySelector("parsererror")) throw new Error("XMind 8 content.xml 内容损坏");
  const sheet = Array.from(xmlDocument.documentElement.children)
    .find((element) => element.localName === "sheet");
  const rootTopic = directChildrenByName(sheet, "topic")[0];
  if (!rootTopic) throw new Error("XMind 8 中没有可导入的主题");
  return convertLegacyTopic(rootTopic, zip);
}

export async function parseXmindTextFile(file) {
  const zip = await JSZip.loadAsync(file);
  const modernFile = zip.file("content.json") || zip.file("/content.json");
  if (modernFile) {
    const sheets = JSON.parse(await modernFile.async("string"));
    const rootTopic = sheets?.[0]?.rootTopic;
    if (!rootTopic) throw new Error("XMind 中没有可导入的主题");
    return convertModernTopic(rootTopic, zip);
  }
  const legacyFile = zip.file("content.xml") || zip.file("/content.xml");
  if (legacyFile) return parseLegacyContent(await legacyFile.async("string"), zip);
  throw new Error("XMind 压缩包中缺少 content.json 或 content.xml");
}
